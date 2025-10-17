import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { now } from "./_lib";

// =======================
// 🔹 LISTAR MANTENIMIENTOS
// =======================
export const listar = query({
  args: {
    q: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { q, limit = 200 }) => {
    let data = await ctx.db.query("mantenimientos").order("desc").take(limit);

    if (q) {
      const nq = q.toLowerCase();
      data = data.filter(
        (m) =>
          m.tipo?.toLowerCase().includes(nq) ||
          m.vehiculoNombre?.toLowerCase().includes(nq)
      );
    }

    // join básico con vehículo
    const vehiculos = await ctx.db.query("vehiculos").collect();
    const vehiculosMap = Object.fromEntries(
      vehiculos.map((v) => [v._id, v.nombre])
    );

    return data.map((m) => ({
      ...m,
      vehiculoNombre: vehiculosMap[m.vehiculoId] ?? "—",
    }));
  },
});

// ========================
// 🔹 ESTADÍSTICAS RESUMEN
// ========================
export const estadisticas = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("mantenimientos").collect();
    const total = all.length;
    const pendientes = all.filter((m) => m.estado === "PENDIENTE").length;
    const enCurso = all.filter((m) => m.estado === "EN_CURSO").length;
    const finalizados = all.filter((m) => m.estado === "FINALIZADO").length;

    return { total, pendientes, enCurso, finalizados };
  },
});

// =====================
// 🔹 CREAR MANTENIMIENTO
// =====================
export const crear = mutation({
  args: {
    vehiculoId: v.id("vehiculos"),
    tipo: v.string(),
    fecha: v.string(), // ISO date
    costo: v.optional(v.number()),
    descripcion: v.optional(v.string()),
    estado: v.union(
      v.literal("PENDIENTE"),
      v.literal("EN_CURSO"),
      v.literal("FINALIZADO")
    ),
  },
  handler: async (ctx, args) => {
    const vehiculo = await ctx.db.get(args.vehiculoId);
    if (!vehiculo) throw new Error("Vehículo no encontrado");

    const mantenimientoId = await ctx.db.insert("mantenimientos", {
      vehiculoId: args.vehiculoId,
      vehiculoNombre: vehiculo.nombre,
      tipo: args.tipo,
      fecha: args.fecha,
      costo: args.costo ?? 0,
      descripcion: args.descripcion ?? "",
      estado: args.estado,
      creadoEn: now(),
      actualizadoEn: now(),
    });

    return mantenimientoId;
  },
});

// ========================
// 🔹 ACTUALIZAR MANTENIMIENTO
// ========================
export const actualizar = mutation({
  args: {
    id: v.id("mantenimientos"),
    tipo: v.optional(v.string()),
    fecha: v.optional(v.string()),
    costo: v.optional(v.number()),
    descripcion: v.optional(v.string()),
    estado: v.optional(
      v.union(
        v.literal("PENDIENTE"),
        v.literal("EN_CURSO"),
        v.literal("FINALIZADO")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, actualizadoEn: now() });
    return id;
  },
});

// =====================
// 🔹 ELIMINAR MANTENIMIENTO
// =====================
export const eliminar = mutation({
  args: { id: v.id("mantenimientos") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});


export const listarConVehiculo = query({
  args: { q: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, { q, limit = 200 }) => {
    // Traemos todos los mantenimientos (filtrados o no)
    let mantenimientos = await ctx.db.query("mantenimientos").order("desc").take(limit);

    if (q) {
      const nq = q.toLowerCase();
      mantenimientos = mantenimientos.filter(
        (m) =>
          m.tipo?.toLowerCase().includes(nq) ||
          m.descripcion?.toLowerCase().includes(nq)
      );
    }

    // Obtenemos todos los vehículos vinculados
    const vehiculos = await ctx.db.query("vehiculos").collect();
    
    const modelos = await ctx.db.query("modelos").collect();
const marcasVehiculos = await ctx.db.query("marcas_vehiculos").collect();

const marcaMap = Object.fromEntries(
  marcasVehiculos.map((m) => [m._id, m.nombre])
);

    // Creamos mapas para joins rápidos
    
    const modeloMap = Object.fromEntries(modelos.map((m) => [m._id, m.nombre]));
    const vehiculoMap = Object.fromEntries(
      vehiculos.map((v) => [
        v._id,
        {
          nombre: v.nombre,
          marca: marcaMap[v.marcaVehiculoId],
          modelo: modeloMap[v._id],
        },
      ])
    );

    // Armamos la respuesta completa
    return mantenimientos.map((m) => {
      const v = vehiculoMap[m.vehiculoId] ?? {};
      return {
        ...m,
        vehiculoNombre: v.nombre || "—",
        marcaNombre: v.marca || "—",
        modeloNombre: v.modelo || "—",
      };
    });
  },
});