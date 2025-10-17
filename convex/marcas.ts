// convex/marcas.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { norm, slugify, now } from "./_lib";

// ============================
// 🔍 Buscar marcas (por texto o cursor)
// ============================
export const buscar = query({
  args: {
    q: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("marcas")),
  },
  handler: async (ctx, { q, limit = 50, cursor }) => {
    let qy = ctx.db.query("marcas");
    if (cursor) qy = qy.filter((qb) => qb.gt(qb.field("_id"), cursor));

    const lote = await qy.take(400);
    const nq = norm(q);
    const items = nq ? lote.filter((d) => norm(d.nombre).includes(nq)) : lote;

    const page = items.slice(0, limit);
    const nextCursor = page.length ? page[page.length - 1]._id : undefined;
    return { items: page, nextCursor };
  },
});

// ============================
// 📋 Listar todas las marcas (para selects, formularios, etc.)
// ============================
export const listar = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("marcas").order("asc").collect();
  },
});

// ============================
// ➕ Crear marca
// ============================
export const crear = mutation({
  args: { nombre: v.string() },
  handler: async (ctx, { nombre }) => {
    const slug = slugify(nombre);
    const ya = await ctx.db
      .query("marcas")
      .filter((qb) => qb.eq(qb.field("slug"), slug))
      .unique();

    if (ya) return ya._id;

    return await ctx.db.insert("marcas", {
      nombre: nombre.trim(),
      slug,
      creadoEn: now(),
      actualizadoEn: now(),
    });
  },
});

// ============================
// ❌ Eliminar marca
// ============================
export const eliminar = mutation({
  args: { id: v.id("marcas") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
