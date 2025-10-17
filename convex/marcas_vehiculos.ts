// convex/marcas_vehiculos.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { slugify, norm, now } from "./_lib";

// ============================
// 🔍 Buscar marcas de vehículos (texto libre o por nombre)
// ============================
export const buscar = query({
  args: {
    q: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("marcas_vehiculos")),
  },
  handler: async (ctx, { q, limit = 50, cursor }) => {
    let qy = ctx.db.query("marcas_vehiculos");
    if (cursor) qy = qy.filter((qb) => qb.gt(qb.field("_id"), cursor));

    const lote = await qy.take(400);
    const nq = norm(q);
    const items = nq
      ? lote.filter((m) => norm(m.nombre).includes(nq))
      : lote;

    const page = items.slice(0, limit);
    const nextCursor = page.length ? page[page.length - 1]._id : undefined;
    return { items: page, nextCursor };
  },
});

// ============================
// 📋 Listar todas las marcas (orden alfabético)
// ============================
export const listar = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("marcas_vehiculos").order("asc").collect();
  },
});

// ============================
// ➕ Crear una nueva marca de vehículo
// ============================
export const crear = mutation({
  args: {
    nombre: v.string(),
    pais: v.optional(v.string()),
    descripcion: v.optional(v.string()),
  },
  handler: async (ctx, { nombre, pais, descripcion }) => {
    const slug = slugify(nombre);
    const existente = await ctx.db
      .query("marcas_vehiculos")
      .filter((qb) => qb.eq(qb.field("slug"), slug))
      .unique();

    if (existente) return existente._id;

    return await ctx.db.insert("marcas_vehiculos", {
      nombre: nombre.trim(),
      slug,
      pais: pais || "",
      descripcion: descripcion || "",
      creadoEn: now(),
      actualizadoEn: now(),
    });
  },
});

// ============================
// ✏️ Actualizar marca de vehículo
// ============================
export const actualizar = mutation({
  args: {
    id: v.id("marcas_vehiculos"),
    nombre: v.optional(v.string()),
    pais: v.optional(v.string()),
    descripcion: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const cambios: any = { actualizadoEn: now() };
    if (updates.nombre) {
      cambios.nombre = updates.nombre.trim();
      cambios.slug = slugify(updates.nombre);
    }
    if (updates.pais !== undefined) cambios.pais = updates.pais;
    if (updates.descripcion !== undefined)
      cambios.descripcion = updates.descripcion;

    await ctx.db.patch(id, cambios);
  },
});

// ============================
// ❌ Eliminar marca
// ============================
export const eliminar = mutation({
  args: { id: v.id("marcas_vehiculos") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
