// convex/repuestos.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { now } from "./_lib";

// ========================
// CREAR REPUESTO
// ========================
export const crear = mutation({
  args: {
    codigo: v.string(),
    nombre: v.string(),
    descripcion: v.optional(v.string()),
    precioUnitario: v.number(),
    categoria: v.string(),
    vehiculo: v.string(),
    marca: v.optional(v.string()),
    modeloCompatible: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // --- evitar duplicados por código ---
    const existe = await ctx.db
      .query("repuestos")
      .filter((qb) => qb.eq(qb.field("codigo"), args.codigo))
      .unique();
    if (existe) throw new Error("Ya existe un repuesto con ese código");

    // 1. Crear repuesto
    const repuestoId = await ctx.db.insert("repuestos", {
      codigo: args.codigo.trim(),
      nombre: args.nombre.trim(),
      descripcion: args.descripcion,
      precioUnitario: args.precioUnitario,
      categoria: args.categoria.trim(),
      vehiculo: args.vehiculo.trim(),
      marca: args.marca,
      modeloCompatible: args.modeloCompatible,
      creadoEn: now(),
      actualizadoEn: now(),
    });

    // 2. Listar todos los depósitos
    const depositos = await ctx.db.query("depositos").collect();

    // 3. Crear repuestos_por_deposito con stock = 0
    for (const deposito of depositos) {
      await ctx.db.insert("repuestos_por_deposito", {
        repuestoId,
        depositoId: deposito._id,
        stock_actual: 0,
        stock_minimo: 0,
        stock_maximo: 0,
      });
    }

    return repuestoId;
  },
});

// ========================
// LISTAR REPUESTOS (solo catálogo, sin stock)
// ========================
export const listar = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("repuestos").collect();
  },
});

// ========================
// OBTENER REPUESTO POR ID
// ========================
export const obtener = query({
  args: { id: v.id("repuestos") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ========================
// ACTUALIZAR REPUESTO
// ========================
export const actualizarRepuesto = mutation({
  args: {
    id: v.id("repuestos"),
    codigo: v.optional(v.string()),
    nombre: v.optional(v.string()),
    descripcion: v.optional(v.string()),
    categoria: v.optional(v.string()),
    vehiculo: v.optional(v.string()),
    marca: v.optional(v.string()),
    modeloCompatible: v.optional(v.string()),
    precioUnitario: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, actualizadoEn: now() });
    return { ok: true };
  },
});

// ========================
// ELIMINAR REPUESTO
// ========================
export const eliminar = mutation({
  args: { id: v.id("repuestos") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});

// ========================
// ASIGNAR REPUESTO A DEPÓSITO
// ========================
export const asignarADeposito = mutation({
  args: {
    repuestoId: v.id("repuestos"),
    depositoId: v.id("depositos"),
    stock_actual: v.number(),
    stock_minimo: v.optional(v.number()),
    stock_maximo: v.optional(v.number()),
    capacidad_maxima: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verificar si ya existe la relación
    const existente = await ctx.db
      .query("repuestos_por_deposito")
      .filter((qb) => qb.eq(qb.field("repuestoId"), args.repuestoId))
      .filter((qb) => qb.eq(qb.field("depositoId"), args.depositoId))
      .unique();

    if (existente) {
      throw new Error("Este repuesto ya está asignado a este depósito.");
    }

    return await ctx.db.insert("repuestos_por_deposito", args);
  },
});

// ========================
// LISTAR REPUESTOS POR DEPÓSITO
// ========================
export const listarPorDeposito = query({
  args: { depositoId: v.id("depositos") },
  handler: async (ctx, args) => {
    const stock = await ctx.db
      .query("repuestos_por_deposito")
      .filter((qb) => qb.eq(qb.field("depositoId"), args.depositoId))
      .collect();

    // Enriquecer con datos del repuesto
    return await Promise.all(
      stock.map(async (s) => {
        const repuesto = await ctx.db.get(s.repuestoId);
        return { ...s, repuesto };
      })
    );
  },
});

// ========================
// BUSCAR REPUESTO + STOCK TOTAL
// ========================
export const buscarConStock = query({
  args: { codigo: v.string() },
  handler: async (ctx, args) => {
    const repuesto = await ctx.db
      .query("repuestos")
      .filter((qb) => qb.eq(qb.field("codigo"), args.codigo))
      .unique();

    if (!repuesto) return null;

    const stocks = await ctx.db
      .query("repuestos_por_deposito")
      .filter((qb) => qb.eq(qb.field("repuestoId"), repuesto._id))
      .collect();

    const stockTotal = stocks.reduce((acc, s) => acc + s.stock_actual, 0);

    return { ...repuesto, stockTotal, distribucion: stocks };
  },
});

export const obtenerPorCodigo = query({
  args: { codigo: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repuestos")
      .filter((qb) => qb.eq(qb.field("codigo"), args.codigo))
      .unique();
  },
});

export const actualizarPorCodigo = mutation({
  args: {
    codigo: v.string(),
    nombre: v.optional(v.string()),
    descripcion: v.optional(v.string()),
    categoria: v.optional(v.string()),
    vehiculo: v.optional(v.string()),
    marca: v.optional(v.string()),
    modeloCompatible: v.optional(v.string()),
    precioUnitario: v.optional(v.number()),
    imagenUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { codigo, ...updates } = args;
    const repuesto = await ctx.db
      .query("repuestos")
      .filter((qb) => qb.eq(qb.field("codigo"), codigo))
      .unique();

    if (!repuesto) throw new Error("Repuesto no encontrado");

    await ctx.db.patch(repuesto._id, { ...updates, actualizadoEn: now() });
    return { ok: true };
  },
});
