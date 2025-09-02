import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Crear traspaso con detalles
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
  handler: async (ctx, args) => {
    const traspasoId = await ctx.db.insert("traspasos", {
      origenId: args.origenId,
      destinoId: args.destinoId,
      usuario: args.usuario,
      fecha: new Date().toISOString(),
      estado: "pendiente",
    });

    for (const d of args.detalles) {
      await ctx.db.insert("detalle_traspaso", {
        traspasoId,
        repuestoId: d.repuestoId,
        cantidad: d.cantidad,
      });
    }

    return traspasoId;
  },
});

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
export const listarTraspasos = query({
  args: {},
  handler: async (ctx) => {
    const traspasos = await ctx.db.query("traspasos").collect();

    return Promise.all(
      traspasos.map(async (t) => {
        // Origen y destino
        const origen = await ctx.db.get(t.origenId);
        const destino = await ctx.db.get(t.destinoId);

        // Traer detalles y enriquecer con datos de repuesto
        const detallesRaw = await ctx.db
          .query("detalle_traspaso")
          .filter((q) => q.eq(q.field("traspasoId"), t._id))
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

        // Devolver objeto listo para frontend
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