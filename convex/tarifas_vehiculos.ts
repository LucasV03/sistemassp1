import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/* ===========================================================
   📋 Listar todas las tarifas (con nombre del tipo incluido)
   =========================================================== */
export const listar = query({
  handler: async (ctx) => {
    const tarifas = await ctx.db.query("tarifas_vehiculos").collect();
    const tipos = await ctx.db.query("tipos_vehiculo").collect();

    // Vincular manualmente para devolver tipoVehiculoNombre actualizado
    return tarifas.map((t) => {
      const tipo = tipos.find((x) => x._id === t.tipoVehiculoId);
      return {
        ...t,
        tipoVehiculoNombre: tipo?.nombre ?? t.tipoVehiculoNombre ?? "—",
      };
    });
  },
});

/* ===========================================================
   ➕ Crear nueva tarifa vinculada a tipoVehiculo
   =========================================================== */
export const crear = mutation({
  args: {
    tipoVehiculoId: v.id("tipos_vehiculo"),
    precioKm: v.number(),
  },
  handler: async (ctx, { tipoVehiculoId, precioKm }) => {
    const tipo = await ctx.db.get(tipoVehiculoId);
    if (!tipo) throw new Error("El tipo de vehículo no existe.");

    // Evita duplicar tarifas para el mismo tipo
    const existente = await ctx.db
      .query("tarifas_vehiculos")
      .withIndex("byTipoVehiculo")
      .filter((q) => q.eq(q.field("tipoVehiculoId"), tipoVehiculoId))
      .unique();

    if (existente) throw new Error("Ya existe una tarifa para este tipo de vehículo.");

    return await ctx.db.insert("tarifas_vehiculos", {
      tipoVehiculoId,
      tipoVehiculoNombre: tipo.nombre,
      precioKm,
      actualizadoEn: Date.now(),
    });
  },
});

/* ===========================================================
   ✏️ Actualizar tarifa existente
   =========================================================== */
export const actualizar = mutation({
  args: {
    id: v.id("tarifas_vehiculos"),
    precioKm: v.number(),
  },
  handler: async (ctx, { id, precioKm }) => {
    await ctx.db.patch(id, {
      precioKm,
      actualizadoEn: Date.now(),
    });
  },
});
