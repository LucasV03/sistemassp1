import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Crear traspaso con detalles

// Confirmar traspaso
export const confirmarTraspaso = mutation({
  args: { traspasoId: v.id("traspasos") },
  handler: async (ctx, { traspasoId }) => {
    const traspaso = await ctx.db.get(traspasoId);
    if (!traspaso || traspaso.estado !== "pendiente") throw new Error("No válido");

    const detalles = await ctx.db
      .query("detalle_traspaso")
      .withIndex("byTraspaso", (q) => q.eq("traspasoId", traspasoId))
      .collect();

    for (const d of detalles) {
      // Descontar en origen
      const stockOrigen = await ctx.db
        .query("repuestos_por_deposito")
        .withIndex("byRepuesto", (q) => q.eq("repuestoId", d.repuestoId))
        .filter((q) => q.eq(q.field("depositoId"), traspaso.origenId))
        .unique();

      if (!stockOrigen || stockOrigen.stock_actual < d.cantidad) {
        throw new Error("Stock insuficiente en origen");
      }
      await ctx.db.patch(stockOrigen._id, {
        stock_actual: stockOrigen.stock_actual - d.cantidad,
      });

      // Sumar en destino
      const stockDestino = await ctx.db
        .query("repuestos_por_deposito")
        .withIndex("byRepuesto", (q) => q.eq("repuestoId", d.repuestoId))
        .filter((q) => q.eq(q.field("depositoId"), traspaso.destinoId))
        .unique();

      if (!stockDestino) {
        await ctx.db.insert("repuestos_por_deposito", {
          repuestoId: d.repuestoId,
          depositoId: traspaso.destinoId,
          stock_actual: d.cantidad,
          stock_minimo: 0,
          stock_maximo: 0,
        });
      } else {
        await ctx.db.patch(stockDestino._id, {
          stock_actual: stockDestino.stock_actual + d.cantidad,
        });
      }
    }

    await ctx.db.patch(traspasoId, { estado: "confirmado" });
    return { ok: true };
  },
});

// Listar traspasos con detalle


// convex/traspasos.ts


export const listarTodos = query({
  args: {},
  handler: async (ctx) => {
    const traspasos = await ctx.db
      .query("traspasos")
      .order("desc") // ordenar por _creationTime (más eficiente que string fecha)
      .collect();

    const resultados = await Promise.all(
      traspasos.map(async (t) => {
        const origen = await ctx.db.get(t.origenId);
        const destino = await ctx.db.get(t.destinoId);

        // Traer los detalles de cada traspaso
        const detalles = await ctx.db
          .query("detalle_traspaso")
          .withIndex("byTraspaso", (q) => q.eq("traspasoId", t._id))
          .collect();

        // Enriquecer cada detalle con el repuesto
        const detallesConRepuestos = await Promise.all(
          detalles.map(async (d) => {
            const repuesto = await ctx.db.get(d.repuestoId);
            return {
              ...d,
              repuesto,
            };
          })
        );

        return {
          ...t,
          origen,
          destino,
          detalles: detallesConRepuestos,
        };
      })
    );

    return resultados;
  },
});
// Listar traspasos pendientes





export const crearTraspaso = mutation({
  args: {
    origenId: v.id("depositos"),
    destinoId: v.id("depositos"),
    usuario: v.string(),
    detalles: v.array(
      v.object({
        repuestoId: v.id("repuestos"),
        cantidad: v.number(),
      })
    ),
  },
  handler: async (ctx, { origenId, destinoId, usuario, detalles }) => {
    if (origenId === destinoId) {
      throw new Error("El depósito de origen y destino no pueden ser iguales");
    }

    // ✅ Validar stock antes de crear
    for (const d of detalles) {
      const repuestoDeposito = await ctx.db
        .query("repuestos_por_deposito")
        .withIndex("byDeposito", (q) => q.eq("depositoId", origenId))
        .filter((q) => q.eq(q.field("repuestoId"), d.repuestoId))
        .first();

      if (!repuestoDeposito) {
        throw new Error(
          `El depósito origen no tiene stock del repuesto ${d.repuestoId}`
        );
      }

      if (repuestoDeposito.stock_actual < d.cantidad) {
        throw new Error(
          `Stock insuficiente para el repuesto ${d.repuestoId}. Disponible: ${repuestoDeposito.stock_actual}, solicitado: ${d.cantidad}`
        );
      }
    }

    // ✅ Si todo ok, crear traspaso
    const traspasoId = await ctx.db.insert("traspasos", {
      origenId,
      destinoId,
      fecha: new Date().toISOString(),
      estado: "pendiente",
      usuario,
    });

    for (const d of detalles) {
      await ctx.db.insert("detalle_traspaso", {
        traspasoId,
        repuestoId: d.repuestoId,
        cantidad: d.cantidad,
      });
    }

    return traspasoId;
  },
});



// Listar traspasos con detalle
export const listarTraspasos = query({
  args: {},
  handler: async (ctx) => {
    const traspasos = await ctx.db.query("traspasos").order("desc").collect();

    return Promise.all(
      traspasos.map(async (t) => {
        const origen = await ctx.db.get(t.origenId);
        const destino = await ctx.db.get(t.destinoId);

        const detallesRaw = await ctx.db
          .query("detalle_traspaso")
          .withIndex("byTraspaso", (q) => q.eq("traspasoId", t._id))
          .collect();

        const detalles = await Promise.all(
          detallesRaw.map(async (d) => {
            const repuesto = await ctx.db.get(d.repuestoId);
            return {
              ...d,
              repuestoCodigo: repuesto?.codigo ?? "—",
              repuestoNombre: repuesto?.nombre ?? "Repuesto sin nombre",
            };
          })
        );

        return {
          ...t,
          origenNombre: origen?.nombre ?? "??",
          destinoNombre: destino?.nombre ?? "??",
          detalles,
        };
      })
    );
  },
});

// Listar traspasos pendientes
export const listarTraspasosPendientes = query({
  args: {},
  handler: async (ctx) => {
    const traspasos = await ctx.db
      .query("traspasos")
      .filter((q) => q.eq(q.field("estado"), "pendiente"))
      .order("desc")
      .collect();

    return Promise.all(
      traspasos.map(async (t) => {
        const detalles = await ctx.db
          .query("detalle_traspaso")
          .withIndex("byTraspaso", (q) => q.eq("traspasoId", t._id))
          .collect();
        return { ...t, detalles };
      })
    );
  },
});

// Listar pendientes por depósito
export const listarPendientesPorDeposito = query({
  args: { depositoId: v.id("depositos") },
  handler: async (ctx, { depositoId }) => {
    const traspasos = await ctx.db
      .query("traspasos")
      .withIndex("byEstado", (q) => q.eq("estado", "pendiente"))
      .order("desc")
      .collect();

    const filtrados = traspasos.filter((t) => t.destinoId === depositoId);

    return Promise.all(
      filtrados.map(async (t) => {
        const origen = await ctx.db.get(t.origenId);
        const destino = await ctx.db.get(t.destinoId);
        const detalles = await ctx.db
          .query("detalle_traspaso")
          .withIndex("byTraspaso", (q) => q.eq("traspasoId", t._id))
          .collect();

        return {
          ...t,
          origenNombre: origen?.nombre,
          destinoNombre: destino?.nombre,
          detalles,
        };
      })
    );
  },
});

// Listar traspasos relacionados a un depósito
export const listarPorDeposito = query({
  args: { depositoId: v.id("depositos") },
  handler: async (ctx, { depositoId }) => {
    const todos = await ctx.db.query("traspasos").order("desc").collect();

    const relacionados = todos.filter(
      (t) => t.origenId === depositoId || t.destinoId === depositoId
    );

    return Promise.all(
      relacionados.map(async (t) => {
        const origen = await ctx.db.get(t.origenId);
        const destino = await ctx.db.get(t.destinoId);

        const detallesRaw = await ctx.db
          .query("detalle_traspaso")
          .withIndex("byTraspaso", (q) => q.eq("traspasoId", t._id))
          .collect();

        const detalles = await Promise.all(
          detallesRaw.map(async (d) => {
            const repuesto = await ctx.db.get(d.repuestoId);
            return {
              ...d,
              repuestoCodigo: repuesto?.codigo ?? "—",
              repuestoNombre: repuesto?.nombre ?? "Repuesto sin nombre",
            };
          })
        );

        return {
          ...t,
          origenNombre: origen?.nombre ?? "Desconocido",
          destinoNombre: destino?.nombre ?? "Desconocido",
          detalles,
        };
      })
    );
  },
});
