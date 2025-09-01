import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel"
// =========================
// 1) Crear encabezado de movimiento
// =========================
export const crearMovimiento = mutation({
  args: {
    depositoId: v.id("depositos"),
    tipoComprobanteId: v.id("tipos_comprobante"),
    tipoMovimientoId: v.id("tipos_movimiento"),
    fecha_registro: v.string(),
    hora_registro: v.string(),
    
  },
  handler: async (ctx, args) => {
    const movimientoId = await ctx.db.insert("movimientos_stock", {
      depositoId: args.depositoId,
      tipoComprobanteId: args.tipoComprobanteId,
      tipoMovimientoId: args.tipoMovimientoId,
      fecha_registro: args.fecha_registro,
      hora_registro: args.hora_registro,
      confirmado: false, 
    });

    return movimientoId;
  },
});

// =========================
// 2) Agregar detalle al movimiento
// =========================
export const agregarDetalle = mutation({
  args: {
    movimientoId: v.id("movimientos_stock"),
    repuestoDepositoId: v.id("repuestos_por_deposito"),
    cantidad: v.number(),
  },
  handler: async (ctx, args) => {
    // Validar que el repuesto/deposito exista
    const repDep = await ctx.db.get(args.repuestoDepositoId);
    if (!repDep) throw new Error("Repuesto en depósito no encontrado");

    return await ctx.db.insert("detalle_movimiento", {
      movimientoId: args.movimientoId,
      repuestoDepositoId: args.repuestoDepositoId,
      cantidad: args.cantidad,
    });
  },
});

// =========================
// 3) Confirmar movimiento y actualizar stock
// =========================
export const confirmarMovimiento = mutation({
  args: { movimientoId: v.id("movimientos_stock") },
  handler: async (ctx, args) => {
    const movimiento = await ctx.db.get(args.movimientoId);
    if (!movimiento) throw new Error("Movimiento no encontrado");
    if (movimiento.confirmado) {
      throw new Error("El movimiento ya está confirmado");
    }

    const tipoMov = await ctx.db.get(movimiento.tipoMovimientoId);
    if (!tipoMov) throw new Error("Tipo de movimiento no encontrado");

    const detalles = await ctx.db
      .query("detalle_movimiento")
      .withIndex("byMovimiento", (q) => q.eq("movimientoId", args.movimientoId))
      .collect();

    if (detalles.length === 0) {
      throw new Error("El movimiento no tiene detalles");
    }

    // Actualizar stock en cada repuesto/deposito
    for (const det of detalles) {
      const repDep = await ctx.db.get(det.repuestoDepositoId);
      if (!repDep) throw new Error("Repuesto en depósito no encontrado");

      let nuevoStock = repDep.stock_actual;

      if (tipoMov.ingreso_egreso === "ingreso") {
        nuevoStock += det.cantidad;
        if (repDep.capacidad_maxima && nuevoStock > repDep.capacidad_maxima) {
          throw new Error(
            `No se puede exceder la capacidad máxima (${repDep.capacidad_maxima}) del depósito`
          );
        }
      } else if (tipoMov.ingreso_egreso === "egreso") {
        if (repDep.stock_actual < det.cantidad) {
          throw new Error(
            `Stock insuficiente para el repuesto en depósito (${repDep.stock_actual} disponibles)`
          );
        }
        nuevoStock -= det.cantidad;
      }

      await ctx.db.patch(det.repuestoDepositoId, { stock_actual: nuevoStock });
    }

    // marcar como confirmado
    await ctx.db.patch(args.movimientoId, { confirmado: true });

    return { ok: true, mensaje: "Movimiento confirmado y stock actualizado" };
  },
});

// =========================
// 4) Transferir entre depósitos
// =========================
export const transferirEntreDepositos = mutation({
  args: {
    depositoOrigenId: v.id("depositos"),
    depositoDestinoId: v.id("depositos"),
    tipoComprobanteId: v.id("tipos_comprobante"),
    repuestos: v.array(
      v.object({
        repuestoOrigenId: v.id("repuestos_por_deposito"),
        repuestoDestinoId: v.id("repuestos_por_deposito"),
        cantidad: v.number(),
      })
    ),
    fecha: v.string(),
    hora: v.string(),
  },
  handler: async (ctx, args) => {
    const egresoTipo = await ctx.db
      .query("tipos_movimiento")
      .filter((q) => q.eq(q.field("ingreso_egreso"), "egreso"))
      .first();
    const ingresoTipo = await ctx.db
      .query("tipos_movimiento")
      .filter((q) => q.eq(q.field("ingreso_egreso"), "ingreso"))
      .first();

    if (!egresoTipo || !ingresoTipo) {
      throw new Error("Debe existir un tipo de movimiento ingreso y egreso");
    }

    const movEgresoId = await ctx.db.insert("movimientos_stock", {
      depositoId: args.depositoOrigenId,
      tipoComprobanteId: args.tipoComprobanteId,
      tipoMovimientoId: egresoTipo._id,
      fecha_registro: args.fecha,
      hora_registro: args.hora,
      confirmado: false,
    });

    const movIngresoId = await ctx.db.insert("movimientos_stock", {
      depositoId: args.depositoDestinoId,
      tipoComprobanteId: args.tipoComprobanteId,
      tipoMovimientoId: ingresoTipo._id,
      fecha_registro: args.fecha,
      hora_registro: args.hora,
      confirmado: false,
    });

    for (const rep of args.repuestos) {
      const repOrigen = await ctx.db.get(rep.repuestoOrigenId);
      if (!repOrigen) throw new Error("Repuesto origen no encontrado");
      if (repOrigen.stock_actual < rep.cantidad) {
        throw new Error(
          `Stock insuficiente en depósito origen (${repOrigen.stock_actual} disponibles)`
        );
      }

      await ctx.db.insert("detalle_movimiento", {
        movimientoId: movEgresoId,
        repuestoDepositoId: rep.repuestoOrigenId,
        cantidad: rep.cantidad,
      });

      await ctx.db.insert("detalle_movimiento", {
        movimientoId: movIngresoId,
        repuestoDepositoId: rep.repuestoDestinoId,
        cantidad: rep.cantidad,
      });
    }

    return {
      ok: true,
      mensaje:
        "Transferencia registrada. Confirmar ambos movimientos para actualizar stock.",
      movimientos: { egreso: movEgresoId, ingreso: movIngresoId },
    };
  },
});

// =========================
// 5) Consultar movimientos por depósito
// =========================
export const listarMovimientosPorDeposito = query({
  args: { depositoId: v.id("depositos") },
  handler: async (ctx, { depositoId }) => {
    const movimientos = await ctx.db
      .query("movimientos_stock")
      .withIndex("byDeposito", (q) => q.eq("depositoId", depositoId))
      .collect();

    // populate nombres
    const result = await Promise.all(
      movimientos.map(async (m) => {
        const tipoComprobante = await ctx.db.get(m.tipoComprobanteId);
        const tipoMovimiento = await ctx.db.get(m.tipoMovimientoId);
        return {
          ...m,
          tipoComprobante,
          tipoMovimiento,
        };
      })
    );

    // (Opcional) ordenar por fecha/hora
    result.sort((a, b) => {
      const da = `${a.fecha_registro}T${a.hora_registro}`;
      const db = `${b.fecha_registro}T${b.hora_registro}`;
      return db.localeCompare(da);
    });

    return result;
  },
});

// =========================
// 6) Consultar detalle de un movimiento
// =========================
export const listarDetallesDeMovimiento = query({
  args: { movimientoId: v.id("movimientos_stock") },
  handler: async (ctx, { movimientoId }) => {
    const detalles = await ctx.db
      .query("detalle_movimiento")
      .withIndex("byMovimiento", (q) => q.eq("movimientoId", movimientoId))
      .collect();

    return Promise.all(
      detalles.map(async (d) => {
        const repDep = await ctx.db.get(d.repuestoDepositoId);
        const repuesto = repDep ? await ctx.db.get(repDep.repuestoId) : null;
        return {
          ...d,
          repuestoDeposito: repDep || null,
          repuesto: repuesto || null,
        };
      })
    );
  },
});


// =========================
// 7) Eliminar movimiento (si no está confirmado)
// =========================
export const eliminarMovimiento = mutation({
  args: { movimientoId: v.id("movimientos_stock") },
  handler: async (ctx, args) => {
    const movimiento = await ctx.db.get(args.movimientoId);
    if (!movimiento) throw new Error("Movimiento no encontrado");
    if (movimiento.confirmado) {
      throw new Error("No se puede eliminar un movimiento confirmado");
    }

    // borrar detalles primero
    const detalles = await ctx.db
      .query("detalle_movimiento")
      .withIndex("byMovimiento", (q) => q.eq("movimientoId", args.movimientoId))
      .collect();

    for (const det of detalles) {
      await ctx.db.delete(det._id);
    }

    await ctx.db.delete(args.movimientoId);

    return { ok: true, mensaje: "Movimiento eliminado correctamente" };
  },
});


export const obtenerMovimiento = query({
  args: { movimientoId: v.id("movimientos_stock") },
  handler: async (ctx, { movimientoId }) => {
    const mov = await ctx.db.get(movimientoId);
    if (!mov) return null;

    const deposito = await ctx.db.get(mov.depositoId);
    const tipoComprobante = await ctx.db.get(mov.tipoComprobanteId);
    const tipoMovimiento = await ctx.db.get(mov.tipoMovimientoId);

    return {
      ...mov,
      deposito,
      tipoComprobante,
      tipoMovimiento,
    };
  },
});


export const agregarDetalleMovimiento = mutation({
  args: {
    movimientoId: v.id("movimientos_stock"),
    repuestoDepositoId: v.id("repuestos_por_deposito"),
    cantidad: v.number(),
  },
  handler: async (ctx, { movimientoId, repuestoDepositoId, cantidad }) => {
    if (cantidad <= 0) {
      throw new Error("La cantidad debe ser mayor a 0.");
    }

    const mov = await ctx.db.get(movimientoId);
    if (!mov) throw new Error("Movimiento no encontrado.");
    if (mov.confirmado) throw new Error("El movimiento ya está confirmado.");

    // Si ya existe el mismo repuesto en el movimiento, sumamos cantidades
    const existente = await ctx.db
      .query("detalle_movimiento")
      .withIndex("byMovimiento", (q) => q.eq("movimientoId", movimientoId))
      .collect();

    const coincide = existente.find(
      (d) => d.repuestoDepositoId === repuestoDepositoId
    );

    if (coincide) {
      await ctx.db.patch(coincide._id, {
        cantidad: coincide.cantidad + cantidad,
      });
      return coincide._id;
    }

    const id = await ctx.db.insert("detalle_movimiento", {
      movimientoId,
      repuestoDepositoId,
      cantidad,
    });
    return id;
  },
});

// Eliminar un ítem del movimiento (si no está confirmado)
export const eliminarDetalleMovimiento = mutation({
  args: { detalleId: v.id("detalle_movimiento") },
  handler: async (ctx, { detalleId }) => {
    const det = await ctx.db.get(detalleId);
    if (!det) return;

    const mov = await ctx.db.get(det.movimientoId);
    if (!mov) return;
    if (mov.confirmado) throw new Error("No se pueden modificar ítems confirmados.");

    await ctx.db.delete(detalleId);
  },
});
export const listarRepuestosEnDeposito = query({
  args: { depositoId: v.id("depositos") },
  handler: async (ctx, { depositoId }) => {
    // Todos los repuestos vinculados al depósito
    const repuestosDeposito = await ctx.db
      .query("repuestos_por_deposito")
      .withIndex("byDeposito", (q) => q.eq("depositoId", depositoId))
      .collect();

    // Enriquecer cada registro con la info del repuesto
    return await Promise.all(
      repuestosDeposito.map(async (rd) => {
        const repuesto = await ctx.db.get(rd.repuestoId);
        return {
          _id: rd._id, // necesario para <option key>
          stock_actual: rd.stock_actual,
          repuesto: repuesto
            ? { _id: repuesto._id, codigo: repuesto.codigo, nombre: repuesto.nombre }
            : null,
        };
      })
    );
  },
});