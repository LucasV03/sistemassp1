import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";

/* =========================================================
   📋 VIAJES - CRUD + ESTADÍSTICAS
   ========================================================= */

/* ---------- CREAR ---------- */
export const crear = mutation({
  args: {
    clienteId: v.id("clientes_ventas"),
    choferId: v.id("choferes"),
    origen: v.string(),
    destino: v.string(),
    distanciaKm: v.number(),
    estado: v.union(
      v.literal("PENDIENTE"),
      v.literal("EN_CURSO"),
      v.literal("FINALIZADO"),
      v.literal("CANCELADO")
    ),
  },
  handler: async (ctx, a) => {
    if (!a.origen || !a.destino)
      throw new ConvexError("Debe indicar origen y destino.");

    const nuevoViajeId = await ctx.db.insert("viajes", {
      clienteId: a.clienteId,
      choferId: a.choferId,
      origen: a.origen.trim(),
      destino: a.destino.trim(),
      distanciaKm: a.distanciaKm,
      estado: a.estado ?? "PENDIENTE",
      creadoEn: Date.now(),
    });

    return nuevoViajeId;
  },
});

/* ---------- OBTENER ---------- */
export const obtener = query({
  args: { id: v.id("viajes") },
  handler: async (ctx, a) => {
    const viaje = await ctx.db.get(a.id);
    if (!viaje) throw new ConvexError("Viaje no encontrado.");
    return viaje;
  },
});

/* ---------- ACTUALIZAR ---------- */
export const actualizar = mutation({
  args: {
    id: v.id("viajes"),
    clienteId: v.optional(v.id("clientes_ventas")),
    choferId: v.optional(v.id("choferes")),
    origen: v.optional(v.string()),
    destino: v.optional(v.string()),
    distanciaKm: v.optional(v.number()),
    estado: v.optional(
      v.union(
        v.literal("PENDIENTE"),
        v.literal("EN_CURSO"),
        v.literal("FINALIZADO"),
        v.literal("CANCELADO")
      )
    ),
  },
  handler: async (ctx, a) => {
    const viaje = await ctx.db.get(a.id);
    if (!viaje) throw new ConvexError("Viaje no encontrado.");

    await ctx.db.patch(a.id, {
      ...(a.clienteId ? { clienteId: a.clienteId } : {}),
      ...(a.choferId ? { choferId: a.choferId } : {}),
      ...(a.origen ? { origen: a.origen.trim() } : {}),
      ...(a.destino ? { destino: a.destino.trim() } : {}),
      ...(a.distanciaKm !== undefined ? { distanciaKm: a.distanciaKm } : {}),
      ...(a.estado ? { estado: a.estado } : {}),
      actualizadoEn: Date.now(),
    });
  },
});


/* ---------- ELIMINAR ---------- */
export const eliminar = mutation({
  args: { id: v.id("viajes") },
  handler: async (ctx, a) => {
    const viaje = await ctx.db.get(a.id);
    if (!viaje) throw new ConvexError("Viaje no encontrado.");
    await ctx.db.delete(a.id);
  },
});



/* ---------- ESTADÍSTICAS ---------- */
export const estadisticas = query({
  args: {},
  handler: async (ctx) => {
    const viajes = await ctx.db.query("viajes").collect();

    const total = viajes.length;
    const pendientes = viajes.filter((v) => v.estado === "PENDIENTE").length;
    const enCurso = viajes.filter((v) => v.estado === "EN_CURSO").length;
    const finalizados = viajes.filter((v) => v.estado === "FINALIZADO").length;
    const cancelados = viajes.filter((v) => v.estado === "CANCELADO").length;

    const totalDistancia = viajes.reduce(
      (acc, v) => acc + (v.distanciaKm || 0),
      0
    );
    const promedioDistancia = total ? totalDistancia / total : 0;

    return {
      total,
      pendientes,
      enCurso,
      finalizados,
      cancelados,
      totalDistancia,
      promedioDistancia,
    };
  },
});
export const listarConNombres = query({
  args: {},
  handler: async (ctx) => {
    const viajes = await ctx.db.query("viajes").order("desc").collect();

    // 🔹 Cache para evitar llamadas repetidas a la BD
    const cacheClientes = new Map();
    const cacheChoferes = new Map();
    const cacheVehiculos = new Map();

    const resultados = await Promise.all(
      viajes.map(async (v) => {
        // 🟢 Cliente
        if (!cacheClientes.has(v.clienteId)) {
          cacheClientes.set(v.clienteId, await ctx.db.get(v.clienteId));
        }
        const cliente = cacheClientes.get(v.clienteId);

        // 🟢 Chofer
        if (!cacheChoferes.has(v.choferId)) {
          cacheChoferes.set(v.choferId, await ctx.db.get(v.choferId));
        }
        const chofer = cacheChoferes.get(v.choferId);

        // 🟢 Vehículo (opcional)
        let vehiculo = null;
        if (v.vehiculoId) {
          if (!cacheVehiculos.has(v.vehiculoId)) {
            cacheVehiculos.set(v.vehiculoId, await ctx.db.get(v.vehiculoId));
          }
          vehiculo = cacheVehiculos.get(v.vehiculoId);
        }

        // 🔹 Construcción final
        return {
          ...v,
          clienteNombre:
            cliente?.razonSocial ||
            cliente?.alias ||
            "—",
          choferNombre: chofer
            ? `${chofer.nombre ?? ""} ${chofer.apellido ?? ""}`.trim()
            : "—",
          vehiculoNombre: vehiculo?.nombre ?? "—",
          origen: v.origen,
          destino: v.destino,
          distanciaKm: v.distanciaKm ?? 0,
          estado: v.estado ?? "PENDIENTE",
        };
      })
    );

    return resultados;
  },
});
export const listar = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("viajes").collect();
  },
});