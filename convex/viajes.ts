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
      ...a,
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

/* ---------- LISTAR CON NOMBRES (JOIN) ---------- */
export const listarConNombres = query({
  args: {},
  handler: async (ctx) => {
    const viajes = await ctx.db.query("viajes").collect();
    const clientes = await ctx.db.query("clientes_ventas").collect();
    const choferes = await ctx.db.query("choferes").collect();

    return viajes.map((v) => ({
      ...v,
      clienteNombre:
        clientes.find((c) => c._id === v.clienteId)?.alias ||
        clientes.find((c) => c._id === v.clienteId)?.razonSocial ||
        "—",
      choferNombre:
        choferes.find((ch) => ch._id === v.choferId)?.nombre + " " +
        (choferes.find((ch) => ch._id === v.choferId)?.apellido ?? "") ||
        "—",
    }));
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
