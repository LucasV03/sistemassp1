import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Crear relación repuesto-depósito con stock inicial
export const asignar = mutation({
  args: {
    repuestoId: v.id("repuestos"),
    depositoId: v.id("depositos"),
    stockInicial: v.number(),
  },
  handler: async (ctx, args) => {
    const existente = await ctx.db
      .query("repuestos_por_deposito")
      .filter((q) =>
        q.and(
          q.eq(q.field("repuestoId"), args.repuestoId),
          q.eq(q.field("depositoId"), args.depositoId)
        )
      )
      .first();

    if (existente) {
      throw new Error("Este repuesto ya está asignado a este depósito.");
    }

    return await ctx.db.insert("repuestos_por_deposito", {
      repuestoId: args.repuestoId,
      depositoId: args.depositoId,
      stock_actual: args.stockInicial,
      stock_minimo: 0,
      stock_maximo: 0,
    });
  },
});


// Listar repuestos por depósito (para usar en el remito)
export const listarPorDeposito = query({
  args: { depositoId: v.optional(v.id("depositos")) },
  handler: async (ctx, args) => {
    let registros = ctx.db.query("repuestos_por_deposito");

    if (args.depositoId) {
      registros = registros.filter((q) => q.eq(q.field("depositoId"), args.depositoId));
    }

    const lista = await registros.collect();

    const result = [];
    for (const r of lista) {
      const repuesto = await ctx.db.get(r.repuestoId);
      result.push({
        _id: r._id,
        repuestoId: r.repuestoId,
        nombre: repuesto?.nombre ?? "Desconocido",
        cantidad: r.stock_actual,
      });
    }

    return result;
  },
});

export const ocupadoPorDeposito = query({
  args: { depositoId: v.optional(v.id("depositos")) },
  handler: async (ctx, args) => {
    let repuestosQuery = ctx.db.query("repuestos_por_deposito");

    if (args.depositoId) {
      repuestosQuery = repuestosQuery.filter((q) =>
        q.eq(q.field("depositoId"), args.depositoId)
      );
    }

    const repuestos = await repuestosQuery.collect();

    // Agrupamos por depósito
    const stats: Record<string, number> = {};

    for (const r of repuestos) {
      stats[r.depositoId] = (stats[r.depositoId] || 0) + r.stock_actual;
    }

    return stats;
  },
});


export const actualizarCantidad = mutation({
  args: {
    id: v.id("repuestos_por_deposito"),
    stock_actual: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { stock_actual: args.stock_actual });
  },
});
