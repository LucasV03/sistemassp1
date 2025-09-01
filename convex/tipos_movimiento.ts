import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
export const listar = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tipos_movimiento").collect();
  },
});

export const insertar = mutation({
  args: {
    nombre: v.string(),
    ingreso_egreso: v.union(v.literal("ingreso"), v.literal("egreso")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tipos_movimiento", {
      nombre: args.nombre,
      ingreso_egreso: args.ingreso_egreso,
    });
  },
});