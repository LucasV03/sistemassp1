import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// 🔹 Listar todos los combos activos
export const listar = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("combos_pago")
      .withIndex("byActivo", (q) => q.eq("activo", true))
      .collect();
  },
});

// 🔹 Crear un nuevo combo
export const crear = mutation({
  args: {
    nombre: v.string(),
    descripcion: v.optional(v.string()),
    componentes: v.array(
      v.object({
        medio: v.union(
          v.literal("EFECTIVO"),
          v.literal("TRANSFERENCIA"),
          v.literal("CHEQUE"),
          v.literal("TARJETA"),
          v.literal("OTRO")
        ),
        porcentaje: v.optional(v.number()),
        montoFijo: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("combos_pago", {
      ...args,
      activo: true,
      creadoEn: Date.now(),
    });
  },
});

// 🔹 Editar combo
export const editar = mutation({
  args: {
    id: v.id("combos_pago"),
    nombre: v.string(),
    descripcion: v.optional(v.string()),
    componentes: v.array(
      v.object({
        medio: v.union(
          v.literal("EFECTIVO"),
          v.literal("TRANSFERENCIA"),
          v.literal("CHEQUE"),
          v.literal("TARJETA"),
          v.literal("OTRO")
        ),
        porcentaje: v.optional(v.number()),
        montoFijo: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      nombre: args.nombre,
      descripcion: args.descripcion,
      componentes: args.componentes,
      actualizadoEn: Date.now(),
    });
  },
});

// 🔹 Desactivar combo
export const desactivar = mutation({
  args: { id: v.id("combos_pago") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { activo: false });
  },
});
