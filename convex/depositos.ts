// convex/depositos.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// === LISTAR TODOS LOS DEPÓSITOS ===
export const listar = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("depositos").collect();
  },
});

// === OBTENER UN DEPÓSITO POR ID ===
export const obtener = query({
  args: { id: v.id("depositos") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// === CREAR DEPÓSITO ===
export const crear = mutation({
  args: {
    nombre: v.string(),
    provincia: v.string(),
    ciudad: v.string(),
    calle: v.string(),
    codigoPostal: v.string(),
    capacidad_total: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("depositos", {
      nombre: args.nombre,
      provincia: args.provincia,
      ciudad: args.ciudad,
      calle: args.calle,
      codigoPostal: args.codigoPostal,
      capacidad_total: args.capacidad_total,
    });
  },
});

// === ACTUALIZAR DEPÓSITO ===
export const actualizar = mutation({
  args: {
    id: v.id("depositos"),
    nombre: v.optional(v.string()),
    provincia: v.optional(v.string()),
    ciudad: v.optional(v.string()),
    calle: v.optional(v.string()),
    codigoPostal: v.optional(v.string()),
    capacidad_total: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return id;
  },
});

// === ELIMINAR DEPÓSITO ===
export const eliminar = mutation({
  args: { id: v.id("depositos") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// === BUSCAR POR PROVINCIA ===
export const buscarPorProvincia = query({
  args: { provincia: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("depositos")
      .withIndex("byProvincia", (q) => q.eq("provincia", args.provincia))
      .collect();
  },
});

// === BUSCAR POR CIUDAD ===
export const buscarPorCiudad = query({
  args: { ciudad: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("depositos")
      .withIndex("byCiudad", (q) => q.eq("ciudad", args.ciudad))
      .collect();
  },
});
