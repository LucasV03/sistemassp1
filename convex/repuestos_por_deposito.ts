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
  args: { depositoId: v.id("depositos") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repuestos_por_deposito")
      .filter(q => q.eq(q.field("depositoId"), args.depositoId))
      .collect();
  },
});
