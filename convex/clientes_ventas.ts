// 📄 Archivo: convex/clientes_ventas.ts
import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";

// ==================================================
// 🔹 Utilidad: Validar CUIT solo por longitud
// ==================================================
function validarCUIT(cuit: string): boolean {
  const limpio = cuit.replace(/[^0-9]/g, "");
  return limpio.length === 11; // ✅ Solo verifica que tenga 11 dígitos numéricos
}

// ==================================================
// 🔹 Crear cliente de ventas
// ==================================================
export const crear = mutation({
  args: {
    razonSocial: v.string(),
    alias: v.optional(v.string()),
    cuit: v.string(),
    direccion: v.string(),
    provincia: v.optional(v.string()),
    ciudad: v.optional(v.string()),
    codigoPostal: v.optional(v.string()),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
    estado: v.union(v.literal("ACTIVO"), v.literal("INACTIVO")),
    notas: v.optional(v.string()),
    creadoPor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("📥 Datos recibidos en crear:", args);

    const cuit = args.cuit.replace(/[^0-9]/g, "");
    console.log("👉 CUIT limpio:", cuit);

    // ✅ Validar CUIT (solo cantidad)
    if (!validarCUIT(cuit)) {
      console.log("❌ CUIT inválido (no tiene 11 dígitos):", cuit);
      throw new ConvexError("El CUIT debe tener exactamente 11 dígitos numéricos");
    }

    // ✅ Evitar duplicados
    const existente = await ctx.db
      .query("clientes_ventas")
      .withIndex("by_cuit", (q) => q.eq("cuit", cuit))
      .first();

    if (existente) {
      console.log("⚠️ Cliente existente con mismo CUIT:", existente._id);
      throw new ConvexError("Ya existe un cliente con ese CUIT");
    }

    // ✅ Validar correo si existe
    if (args.email) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email);
      if (!emailOk) throw new ConvexError("El correo electrónico no es válido");
    }

    const id = await ctx.db.insert("clientes_ventas", {
      razonSocial: args.razonSocial.trim(),
      alias: args.alias?.trim() || "",
      cuit,
      direccion: args.direccion.trim(),
      provincia: args.provincia?.trim() || "",
      ciudad: args.ciudad?.trim() || "",
      codigoPostal: args.codigoPostal?.trim() || "",
      telefono: args.telefono?.trim() || "",
      email: args.email?.trim() || "",
      estado: args.estado,
      notas: args.notas?.trim() || "",
      creadoPor: args.creadoPor || "sistema",
      creadoEn: Date.now(),
      actualizadoEn: Date.now(),
    });

    console.log("✅ Cliente creado con ID:", id);
    return id;
  },
});

// ==================================================
// 🔹 Listar clientes con búsqueda flexible
// ==================================================
export const listar = query({
  args: { busqueda: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const todos = await ctx.db.query("clientes_ventas").order("desc").collect();

    if (!args.busqueda) return todos;

    const b = args.busqueda.toLowerCase();
    return todos.filter((c) =>
      [
        c.razonSocial,
        c.alias,
        c.cuit,
        c.direccion,
        c.telefono,
        c.email,
        c.ciudad,
        c.provincia,
      ].some((v) => (v ?? "").toLowerCase().includes(b))
    );
  },
});

// ==================================================
// 🔹 Obtener cliente por ID
// ==================================================
export const obtener = query({
  args: { id: v.id("clientes_ventas") },
  handler: async (ctx, { id }) => {
    const cliente = await ctx.db.get(id);
    if (!cliente) throw new ConvexError("Cliente no encontrado");
    return cliente;
  },
});

// ==================================================
// 🔹 Actualizar cliente
// ==================================================
export const actualizar = mutation({
  args: {
    id: v.id("clientes_ventas"),
    razonSocial: v.string(),
    alias: v.optional(v.string()),
    cuit: v.string(),
    direccion: v.string(),
    provincia: v.optional(v.string()),
    ciudad: v.optional(v.string()),
    codigoPostal: v.optional(v.string()),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
    estado: v.union(v.literal("ACTIVO"), v.literal("INACTIVO")),
    notas: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...data }) => {
    const cliente = await ctx.db.get(id);
    if (!cliente) throw new ConvexError("Cliente no encontrado");

    const cuit = data.cuit.replace(/[^0-9]/g, "");
    if (!validarCUIT(cuit))
      throw new ConvexError("El CUIT debe tener exactamente 11 dígitos numéricos");

    if (data.email) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
      if (!emailOk) throw new ConvexError("El correo electrónico no es válido");
    }

    await ctx.db.patch(id, {
      ...data,
      cuit,
      actualizadoEn: Date.now(),
    });
  },
});

// ==================================================
// 🔹 Eliminar cliente (si no tiene contratos)
// ==================================================
export const eliminar = mutation({
  args: { id: v.id("clientes_ventas") },
  handler: async (ctx, { id }) => {
    const cliente = await ctx.db.get(id);
    if (!cliente) throw new ConvexError("Cliente no encontrado");

    const contratos = await ctx.db
      .query("contratos_servicios")
      .withIndex("byCliente", (q) => q.eq("clienteId", id))
      .collect();

    if (contratos.length > 0) {
      throw new ConvexError(
        "No se puede eliminar el cliente: tiene contratos asociados."
      );
    }

    await ctx.db.delete(id);
    return { ok: true };
  },
});
