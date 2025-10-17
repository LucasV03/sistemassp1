import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { now } from "./_lib";

// 🔹 Listar choferes
export const listar = query({
  args: {},
  handler: async (ctx) => {
    const choferes = await ctx.db.query("choferes").order("desc").collect();

    // Agregamos nombreCompleto sin romper normalización
    return choferes.map((c) => ({
      ...c,
      nombreCompleto: `${c.nombre} ${c.apellido}`,
    }));
  },
});

// 🔹 Estadísticas globales
export const estadisticas = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("choferes").collect();
    const total = all.length;
    const activos = all.filter((c) => c.estado === "ACTIVO").length;
    const inactivos = total - activos;
    return { total, activos, inactivos };
  },
});

// 🔹 Crear chofer
export const crear = mutation({
  args: {
    nombre: v.string(),
    apellido: v.string(),
    dni: v.string(),
    telefono: v.optional(v.string()),
    licencia: v.string(),
    estado: v.union(v.literal("ACTIVO"), v.literal("INACTIVO")),
  },
  handler: async (ctx, args) => {
    // Verificar duplicado por DNI
    const existe = await ctx.db
      .query("choferes")
      .filter((q) => q.eq(q.field("dni"), args.dni))
      .unique();

    if (existe) throw new Error("Ya existe un chofer con ese DNI.");

    // Inserción normalizada
    return await ctx.db.insert("choferes", {
      ...args,
      creadoEn: now(),
    });
  },
});

// 🔹 Actualizar chofer
export const actualizar = mutation({
  args: {
    id: v.id("choferes"),
    nombre: v.string(),
    apellido: v.string(),
    dni: v.string(),
    telefono: v.optional(v.string()),
    licencia: v.string(),
    estado: v.union(v.literal("ACTIVO"), v.literal("INACTIVO")),
  },
  handler: async (ctx, { id, ...data }) => {
    const existente = await ctx.db.get(id);
    if (!existente) throw new Error("Chofer no encontrado.");

    // Evita conflicto de DNI duplicado
    const otro = await ctx.db
      .query("choferes")
      .filter((q) => q.and(q.eq(q.field("dni"), data.dni), q.neq(q.field("_id"), id)))
      .unique();

    if (otro) throw new Error("Otro chofer ya tiene ese DNI.");

    await ctx.db.patch(id, { ...data });
  },
});

// 🔹 Eliminar chofer
export const eliminar = mutation({
  args: { id: v.id("choferes") },
  handler: async (ctx, { id }) => {
    const existe = await ctx.db.get(id);
    if (!existe) throw new Error("Chofer no encontrado.");
    await ctx.db.delete(id);
  },
});

// 🔹 Obtener chofer por ID
export const obtener = query({
  args: { id: v.id("choferes") },
  handler: async (ctx, { id }) => {
    const chofer = await ctx.db.get(id);
    if (!chofer) return null;
    return { ...chofer, nombreCompleto: `${chofer.nombre} ${chofer.apellido}` };
  },
});
