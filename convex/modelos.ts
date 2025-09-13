// convex/modelos.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { norm, slugify, now } from "./_lib";

export const buscar = query({
  args: {
    q: v.optional(v.string()),
    marcaId: v.optional(v.id("marcas")),
    vehiculoId: v.optional(v.id("vehiculos")),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("modelos")),
  },
  handler: async (ctx, { q, marcaId, vehiculoId, limit = 50, cursor }) => {
    let qy = ctx.db.query("modelos");
    if (marcaId) qy = qy.filter((qb) => qb.eq(qb.field("marcaId"), marcaId));
    if (vehiculoId) qy = qy.filter((qb) => qb.eq(qb.field("vehiculoId"), vehiculoId));
    if (cursor) qy = qy.filter((qb) => qb.gt(qb.field("_id"), cursor));

    const lote = await qy.take(400);
    const nq = norm(q);
    const items = nq ? lote.filter((d) => norm(d.nombre).includes(nq)) : lote;

    const page = items.slice(0, limit);
    const nextCursor = page.length ? page[page.length - 1]._id : undefined;
    return { items: page, nextCursor };
  },
});

export const crear = mutation({
  args: {
    nombre: v.string(),
    marcaId: v.id("marcas"),
    vehiculoId: v.id("vehiculos"),
  },
  handler: async (ctx, { nombre, marcaId, vehiculoId }) => {
    const slug = slugify(nombre);
    const claveUnica = `${marcaId}|${vehiculoId}|${slug}`;

    const ya = await ctx.db
      .query("modelos")
      .filter((qb) => qb.eq(qb.field("claveUnica"), claveUnica))
      .unique();
    if (ya) return ya._id;

    return await ctx.db.insert("modelos", {
      nombre: nombre.trim(),
      slug,
      marcaId,
      vehiculoId,
      claveUnica,
      creadoEn: now(),
      actualizadoEn: now(),
    });
  },
});

export const eliminar = mutation({
  args: { id: v.id("modelos") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
