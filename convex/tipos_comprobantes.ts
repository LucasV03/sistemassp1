import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listar = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tipos_comprobante").collect();
  },
});

export const insertar = mutation({
  args: {
    nombre: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tipos_comprobante", args);
  },
});