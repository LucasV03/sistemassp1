// convex/vehiculos.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { norm, slugify, now } from "./_lib";

// ============================
// 🔍 Buscar vehículos (filtro + marca + join con marcas)
// ============================
export const buscar = query({
  args: {
    q: v.optional(v.string()),
    marcaVehiculoId: v.optional(v.id("marcas_vehiculos")),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("vehiculos")),
  },
  handler: async (ctx, { q, marcaVehiculoId, limit = 50, cursor }) => {
    let qy = ctx.db.query("vehiculos");

    if (marcaVehiculoId) {
      qy = qy.filter((qb) => qb.eq(qb.field("marcaVehiculoId"), marcaVehiculoId));
    }

    if (cursor) {
      qy = qy.filter((qb) => qb.gt(qb.field("_id"), cursor));
    }

    const lote = await qy.take(400);

    const nq = norm(q);
    const filtrados = nq
      ? lote.filter((d) => {
          const texto = [d.nombre, d.patente, d.tipo].join(" ").toLowerCase();
          return texto.includes(nq.toLowerCase());
        })
      : lote;

    // 🔹 Hacemos el "join" con marcas_vehiculos
    const items = await Promise.all(
      filtrados.map(async (vehiculo) => {
        let marcaNombre = "";
        if (vehiculo.marcaVehiculoId) {
          const marca = await ctx.db.get(vehiculo.marcaVehiculoId);
          marcaNombre = marca?.nombre ?? "";
        }
        return { ...vehiculo, marcaNombre };
      })
    );

    const page = items.slice(0, limit);
    const nextCursor = page.length ? page[page.length - 1]._id : undefined;

    return { items: page, nextCursor };
  },
});

// ============================
// 📋 Listar todos (simple)
// ============================
export const listar = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("vehiculos").order("desc").collect();
  },
});

// ============================
// ➕ Crear vehículo
// ============================
export const crear = mutation({
  args: {
    nombre: v.string(),
    marcaVehiculoId: v.id("marcas_vehiculos"), // ✅ cambio
    patente: v.optional(v.string()),
    tipo: v.optional(v.string()),
    capacidad: v.optional(v.number()),
    estado: v.optional(
      v.union(
        v.literal("OPERATIVO"),
        v.literal("MANTENIMIENTO"),
        v.literal("FUERA_SERVICIO")
      )
    ),
  },
  handler: async (ctx, { nombre, marcaVehiculoId, ...extra }) => {
    const slug = slugify(nombre);
    const ya = await ctx.db
      .query("vehiculos")
      .filter((qb) => qb.eq(qb.field("marcaVehiculoId"), marcaVehiculoId))
      .filter((qb) => qb.eq(qb.field("slug"), slug))
      .unique();

    if (ya) return ya._id;

    return await ctx.db.insert("vehiculos", {
      nombre: nombre.trim(),
      slug,
      marcaVehiculoId,
      estado: extra.estado ?? "OPERATIVO",
      creadoEn: now(),
      actualizadoEn: now(),
      ...extra,
    });
  },
});

// ============================
// 🧩 Actualizar vehículo
// ============================
export const actualizar = mutation({
  args: {
    id: v.id("vehiculos"),
    nombre: v.string(),
    marcaVehiculoId: v.id("marcas_vehiculos"),
    patente: v.optional(v.string()),
    tipo: v.optional(v.string()),
    capacidad: v.optional(v.number()),
    estado: v.optional(
      v.union(
        v.literal("OPERATIVO"),
        v.literal("MANTENIMIENTO"),
        v.literal("FUERA_SERVICIO")
      )
    ),
  },
  handler: async (ctx, { id, nombre, ...data }) => {
    await ctx.db.patch(id, {
      ...data,
      nombre: nombre.trim(),
      actualizadoEn: now(),
    });
  },
});

// ============================
// ❌ Eliminar vehículo
// ============================
export const eliminar = mutation({
  args: { id: v.id("vehiculos") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

// ============================
// 📊 KPI / Estadísticas
// ============================
export const estadisticas = query({
  args: {},
  handler: async (ctx) => {
    const vehiculos = await ctx.db.query("vehiculos").collect();
    const total = vehiculos.length;
    const operativos = vehiculos.filter((v) => v.estado === "OPERATIVO").length;
    const mantenimiento = vehiculos.filter(
      (v) => v.estado === "MANTENIMIENTO"
    ).length;
    const fuera = vehiculos.filter(
      (v) => v.estado === "FUERA_SERVICIO"
    ).length;

    return { total, operativos, mantenimiento, fuera };
  },
});
