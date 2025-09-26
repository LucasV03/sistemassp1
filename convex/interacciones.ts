// ==========================
// ARCHIVO: convex/interacciones.ts
// ==========================
import { queryGeneric, mutationGeneric } from "convex/server";
import { v } from "convex/values";

// Crear/registrar interacción
export const registrarInteraccion = mutationGeneric({
  args: {
    clienteId: v.id("clientes"),
    contratoId: v.optional(v.id("contratos")),
    tipo: v.string(),            // 'llamada' | 'correo' | 'reunión' | 'ticket'
    resumen: v.string(),
    proximaAccion: v.optional(v.string()), // ISO (yyyy-mm-dd) opcional
  },
  handler: async (ctx: any, args: any) => {
    // (opcional) podrías validar que el cliente exista:
    // const cliente = await ctx.db.get(args.clienteId);
    // if (!cliente) throw new Error("Cliente inexistente");
    return await ctx.db.insert("interacciones", {
      ...args,
      creadoEn: Date.now(),
    });
  },
});

// Actualizar interacción (la que te está faltando)
export const actualizarInteraccion = mutationGeneric({
  args: {
    id: v.id("interacciones"),
    tipo: v.string(),
    resumen: v.string(),
    proximaAccion: v.optional(v.string()),
  },
  handler: async (ctx: any, { id, ...cambios }: any) => {
    const existente = await ctx.db.get(id);
    if (!existente) throw new Error("Interacción no encontrada");
    return await ctx.db.patch(id, { ...cambios });
  },
});

// Listar interacciones por cliente
export const interaccionesPorCliente = queryGeneric({
  args: { clienteId: v.id("clientes") },
  handler: async (ctx: any, { clienteId }: any) => {
    return await ctx.db
      .query("interacciones")
      .withIndex("por_cliente", (q: any) => q.eq("clienteId", clienteId))
      .order("desc")
      .collect();
  },
});