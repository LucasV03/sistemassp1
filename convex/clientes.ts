// ARCHIVO: convex/clientes.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { mutationGeneric } from "convex/server";


export const crear = mutation({
  args: {
    nombre: v.string(),
    correo: v.string(),
    telefono: v.optional(v.string()),
    empresa: v.optional(v.string()),
    notas: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const correoNormalizado = args.correo.trim().toLowerCase();

    // Regex literal (NO como string). Si tu editor cambia barras, reescribilo manualmente.
    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado);
    if (!correoValido) {
      throw new Error("El correo no es válido");
    }

    const existente = await ctx.db
      .query("clientes")
      .withIndex("por_correo", (q) => q.eq("correo", correoNormalizado))
      .unique();

    if (existente) {
      throw new Error("Ya existe un cliente con ese correo");
    }

    return await ctx.db.insert("clientes", {
      nombre: args.nombre.trim(),
      correo: correoNormalizado,
      telefono: args.telefono?.trim(),
      empresa: args.empresa?.trim(),
      notas: args.notas?.trim(),
      creadoEn: Date.now(),
    });
  },
});

export const listar = query({
  args: { busqueda: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // order("desc") es válido (ordena por _creationTime). Si tu versión de Convex diera error,
    // reemplazalo por: const todos = await ctx.db.query("clientes").collect();
    const todos = await ctx.db.query("clientes").order("desc").collect();
    if (!args.busqueda) return todos;

    const b = args.busqueda.toLowerCase();
    return todos.filter((c) =>
      [c.nombre, c.correo, c.telefono ?? "", c.empresa ?? ""].some((t) =>
        (t ?? "").toLowerCase().includes(b)
      )
    );
  },
});

export const obtener = query({
  args: { id: v.id("clientes") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const actualizar = mutation({
  args: {
    id: v.id("clientes"),
    nombre: v.string(),
    correo: v.string(),
    telefono: v.optional(v.string()),
    empresa: v.optional(v.string()),
    notas: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...data }) => {
    const cliente = await ctx.db.get(id);
    if (!cliente) {
      throw new Error("Cliente no encontrado");
    }
    return await ctx.db.patch(id, { ...data });
  },
});

export const eliminar = mutation({
  args: { id: v.id("clientes") },
  handler: async (ctx, { id }) => {
    return await ctx.db.delete(id);
  },
});

export const eliminarCliente = mutationGeneric({
  args: { id: v.id("clientes") },
  handler: async (ctx: any, { id }: any) => {
    const cliente = await ctx.db.get(id);
    if (!cliente) throw new Error("Cliente no encontrado");

    // 1) Contratos del cliente
    const contratos = await ctx.db
      .query("contratos")
      .withIndex("por_cliente", (q: any) => q.eq("clienteId", id))
      .collect();

    for (const c of contratos) {
      // 1.1) Adjuntos del contrato (+ borrar blobs)
      const adjuntos = await ctx.db
        .query("contratos_adjuntos")
        .withIndex("por_contrato", (q: any) => q.eq("contratoId", c._id))
        .collect();

      for (const a of adjuntos) {
        try {
          if (a.archivoId) {
            await ctx.storage.delete(a.archivoId);
          }
        } catch { /* ignorar si no existe */ }
        await ctx.db.delete(a._id);
      }

      // 1.2) Interacciones ligadas al contrato
      const interaccionesContrato = await ctx.db
        .query("interacciones")
        .withIndex("por_contrato", (q: any) => q.eq("contratoId", c._id))
        .collect();
      for (const i of interaccionesContrato) {
        await ctx.db.delete(i._id);
      }

      // 1.3) Historial del contrato
      const historial = await ctx.db
        .query("contratos_historial")
        .withIndex("por_contrato", (q: any) => q.eq("contratoId", c._id))
        .collect();
      for (const h of historial) {
        await ctx.db.delete(h._id);
      }

      // 1.4) Finalmente el contrato
      await ctx.db.delete(c._id);
    }

    // 2) Interacciones del cliente no asociadas a contrato
    const interaccionesCliente = await ctx.db
      .query("interacciones")
      .withIndex("por_cliente", (q: any) => q.eq("clienteId", id))
      .collect();
    for (const i of interaccionesCliente) {
      await ctx.db.delete(i._id);
    }

    // 3) Eliminar el cliente
    await ctx.db.delete(id);

    return { ok: true };
  },
});