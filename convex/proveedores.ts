// convex/proveedores.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const listar = query({
  args: {
    soloActivos: v.optional(v.boolean()),
    buscar: v.optional(v.string()),
    ordenarPor: v.optional(
      v.union(
        v.literal("nombre"),
        v.literal("contacto_principal"),
        v.literal("email"),
        v.literal("reputacion"),
        v.literal("telefono"),
        v.literal("direccion"),
        v.literal("notas"),
        v.literal("cuit"),
        v.literal("estado") // sintético: activo/inactivo
      )
    ),
    orden: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const { soloActivos, buscar, ordenarPor = "nombre", orden = "asc" } = args;

    let items = await ctx.db.query("proveedores").collect();

    // filtros
    if (soloActivos) {
      items = items.filter((p) => p.activo);
    }

    if (buscar && buscar.trim() !== "") {
      const b = buscar.toLowerCase();
      items = items.filter((p) =>
        [
          p.nombre,
          p.contacto_principal,
          p.email,
          p.telefono,
          p.direccion,
          p.cuit ?? "",
          p.notas ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(b)
      );
    }

    // orden
    const dir = orden === "desc" ? -1 : 1;
    items.sort((a, b) => {
      const A =
        ordenarPor === "estado"
          ? a.activo
            ? "Activo"
            : "Inactivo"
          : (a as any)[ordenarPor] ?? "";
      const B =
        ordenarPor === "estado"
          ? b.activo
            ? "Activo"
            : "Inactivo"
          : (b as any)[ordenarPor] ?? "";

      if (A < B) return -1 * dir;
      if (A > B) return 1 * dir;
      return 0;
    });

    return items;
  },
});

export const obtener = query({
  args: { id: v.id("proveedores") },
  handler: async (ctx, { id }) => {
    const p = await ctx.db.get(id);
    if (!p) throw new Error("Proveedor no encontrado");
    return p;
  },
});



export const editar = mutation({
  args: {
    id: v.id("proveedores"),
    data: v.object({
      nombre: v.optional(v.string()),
      contacto_principal: v.optional(v.string()),
      telefono: v.optional(v.string()),
      email: v.optional(v.string()),
      direccion: v.optional(v.string()),
      activo: v.optional(v.boolean()),
      reputacion: v.optional(v.number()),
      cuit: v.optional(v.string()),
      notas: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { id, data }) => {
    const prev = await ctx.db.get(id);
    if (!prev) throw new Error("Proveedor no encontrado");

    // si cambia el nombre, chequear unicidad
    if (data.nombre && data.nombre.toLowerCase() !== prev.nombre.toLowerCase()) {
      const repetido = (await ctx.db.query("proveedores").collect()).some(
        (p) => p._id !== id && p.nombre.toLowerCase() === data.nombre!.toLowerCase()
      );
      if (repetido) throw new Error("Ya existe un proveedor con ese nombre");
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error("Email inválido");
    }

    await ctx.db.patch(id, data as any);
  },
});

export const activar = mutation({
  args: { id: v.id("proveedores") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { activo: true });
  },
});

export const desactivar = mutation({
  args: { id: v.id("proveedores") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { activo: false });
  },
});

/**
 * Agrega un Id<"repuestos"> al array de productos_ofrecidos evitando duplicados
 */


/**
 * Elimina un Id<"repuestos"> del array de productos_ofrecidos
 */

export const crear = mutation({
  args: {
    nombre: v.string(),
    contacto_principal: v.string(),
    telefono: v.string(),
    email: v.string(),
    direccion: v.string(),
    activo: v.boolean(),
    reputacion: v.optional(v.number()),
    cuit : v.string(),
    notas: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // unicidad por nombre
    const repetido = (await ctx.db.query("proveedores").collect()).some(
      (p) => p.nombre.toLowerCase() === args.nombre.toLowerCase()
    );
    if (repetido) throw new Error("Ya existe un proveedor con ese nombre");

    // validación simple de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) {
      throw new Error("Email inválido");
    }

    const id = await ctx.db.insert("proveedores", args);
    return id;
  },
});