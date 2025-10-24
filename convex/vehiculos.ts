// convex/vehiculos.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { now } from "./_lib"; // ✅ ya no usamos slugify ni norm aquí

// ============================
// 🔍 Buscar vehículos (filtro + marca + join con marcas y tipos)
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

    const nq = q?.toLowerCase().trim() ?? "";

    // 🔹 JOIN con marcas y tipos
    const items = await Promise.all(
      lote.map(async (vehiculo) => {
        const marca = vehiculo.marcaVehiculoId
          ? await ctx.db.get(vehiculo.marcaVehiculoId)
          : null;

        const tipo = vehiculo.tipoVehiculoId
          ? await ctx.db.get(vehiculo.tipoVehiculoId)
          : null;

        const texto = [vehiculo.nombre, vehiculo.patente, tipo?.nombre]
          .join(" ")
          .toLowerCase();

        if (!nq || texto.includes(nq)) {
          return {
            ...vehiculo,
            marcaNombre: marca?.nombre ?? "",
            tipoVehiculoNombre: tipo?.nombre ?? "",
          };
        }
        return null;
      })
    );

    const filtrados = items.filter((x) => x !== null);

    const page = filtrados.slice(0, limit);
    const nextCursor = page.length ? page[page.length - 1]!._id : undefined;

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
    marcaVehiculoId: v.id("marcas_vehiculos"),
    tipoVehiculoId: v.id("tipos_vehiculo"), // ✅ nuevo campo obligatorio
    patente: v.optional(v.string()),
    capacidad: v.optional(v.number()),
    estado: v.optional(
      v.union(
        v.literal("OPERATIVO"),
        v.literal("MANTENIMIENTO"),
        v.literal("FUERA_SERVICIO")
      )
    ),
  },
  handler: async (
    ctx,
    { nombre, marcaVehiculoId, tipoVehiculoId, patente, capacidad, estado }
  ) => {
    // Evita duplicados por nombre + marca
    const ya = await ctx.db
      .query("vehiculos")
      .filter((qb) => qb.eq(qb.field("nombre"), nombre.trim()))
      .filter((qb) => qb.eq(qb.field("marcaVehiculoId"), marcaVehiculoId))
      .first();

    if (ya) return ya._id;

    return await ctx.db.insert("vehiculos", {
      nombre: nombre.trim(),
      marcaVehiculoId,
      tipoVehiculoId,
      patente,
      capacidad,
      estado: estado ?? "OPERATIVO",
      creadoEn: now(),
      actualizadoEn: now(),
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
    tipoVehiculoId: v.optional(v.id("tipos_vehiculo")),
    patente: v.optional(v.string()),
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
    const operativos = vehiculos.filter(
      (v) => v.estado === "OPERATIVO"
    ).length;
    const mantenimiento = vehiculos.filter(
      (v) => v.estado === "MANTENIMIENTO"
    ).length;
    const fuera = vehiculos.filter(
      (v) => v.estado === "FUERA_SERVICIO"
    ).length;

    return { total, operativos, mantenimiento, fuera };
  },
});
