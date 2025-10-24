import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listar = query({
  handler: async (ctx) => await ctx.db.query("tipos_vehiculo").collect(),
});

export const crear = mutation({
  args: {
    nombre: v.string(),
  },
  handler: async (ctx, { nombre }) => {
    // Evita duplicados (opcional pero recomendado)
    const existente = await ctx.db
      .query("tipos_vehiculo")
      .withIndex("byNombre")
      .filter((q) => q.eq(q.field("nombre"), nombre.toUpperCase()))
      .unique();

    if (existente) {
      throw new Error("Ya existe un tipo de vehículo con ese nombre.");
    }

    return await ctx.db.insert("tipos_vehiculo", {
      nombre: nombre.toUpperCase(),
      creadoEn: Date.now(),
    });
  },
});