import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ========================
// CREAR DETALLE
// ========================
export const crear = mutation({
  args: {
    traspasoId: v.id("traspasos"),
    repuestoId: v.id("repuestos"),
    cantidad: v.number(),
  },
  handler: async (ctx, args) => {
    // Podrías validar que no exista ya el repuesto en este traspaso
    const existente = await ctx.db
      .query("detalle_traspaso")
      .filter((q) =>
        q.and(
          q.eq(q.field("traspasoId"), args.traspasoId),
          q.eq(q.field("repuestoId"), args.repuestoId)
        )
      )
      .unique();

    if (existente) {
      throw new Error("Este repuesto ya está en el traspaso.");
    }

    return await ctx.db.insert("detalle_traspaso", args);
  },
});

// ========================
// LISTAR DETALLES POR TRASPASO
// ========================
export const listarPorTraspaso = query({
  args: { traspasoId: v.id("traspasos") },
  handler: async (ctx, args) => {
    const detalles = await ctx.db
      .query("detalle_traspaso")
      .filter((q) => q.eq(q.field("traspasoId"), args.traspasoId))
      .collect();

    // Enriquecer con datos del repuesto
    return await Promise.all(
      detalles.map(async (d) => {
        const repuesto = await ctx.db.get(d.repuestoId);
        return {
          ...d,
          repuestoCodigo: repuesto?.codigo,
          repuestoNombre: repuesto?.nombre,
        };
      })
    );
  },
});

// ========================
// ELIMINAR DETALLE
// ========================

