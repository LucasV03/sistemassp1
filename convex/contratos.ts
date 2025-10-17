// ==========================
// ARCHIVO: convex/contratos.ts 
// ==========================

import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";

// 🔹 Validación fechas coherente
function fechasValidas(fechaInicio: string, fechaFin?: string) {
  if (!fechaInicio) return false;
  const di = new Date(fechaInicio);
  if (Number.isNaN(+di)) return false;
  if (fechaFin) {
    const df = new Date(fechaFin);
    if (Number.isNaN(+df)) return false;
    if (df < di) return false;
  }
  return true;
}

// ==========================
// 📌 CREAR CONTRATO
// ==========================
export const crearContrato = mutation({
  args: {
    clienteId: v.id("clientes"),
    titulo: v.string(),
    fechaInicio: v.string(),
    fechaFin: v.optional(v.string()),
    monto: v.number(),
    estado: v.string(), // pendiente | activo | finalizado | cancelado
    notas: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cliente = await ctx.db.get(args.clienteId);
    if (!cliente) throw new Error("Cliente inexistente");

    if (!fechasValidas(args.fechaInicio, args.fechaFin)) {
      throw new Error("Fechas inválidas (fin no puede ser anterior al inicio).");
    }

    return await ctx.db.insert("contratos", {
      ...args,
      creadoEn: Date.now(),
    });
  },
});

// ==========================
// 📌 ACTUALIZAR CONTRATO
// ==========================
export const actualizarContrato = mutation({
  args: {
    id: v.id("contratos"),
    titulo: v.string(),
    fechaInicio: v.string(),
    fechaFin: v.optional(v.string()),
    monto: v.number(),
    estado: v.string(),
    notas: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...cambios }) => {
    const existente = await ctx.db.get(id);
    if (!existente) throw new Error("Contrato no encontrado");

    if (!fechasValidas(cambios.fechaInicio, cambios.fechaFin)) {
      throw new Error("Fechas inválidas (fin no puede ser anterior al inicio).");
    }

    // Guardar historial previo
    await ctx.db.insert("contratos_historial", {
      contratoId: id,
      cambiadoEn: Date.now(),
      estadoAnterior: existente.estado,
      montoAnterior: existente.monto,
      fechaInicioAnterior: existente.fechaInicio,
      fechaFinAnterior: existente.fechaFin,
      notasAnteriores: existente.notas,
      tipoCambio: "actualizar",
    });

    return await ctx.db.patch(id, { ...cambios });
  },
});

// ==========================
// 📌 LISTAR CONTRATOS POR CLIENTE
// ==========================
export const contratosPorCliente = query({
  args: { clienteId: v.id("clientes") },
  handler: async (ctx, { clienteId }) => {
    return await ctx.db
      .query("contratos")
      .withIndex("por_cliente", (q) => q.eq("clienteId", clienteId))
      .order("desc")
      .collect();
  },
});

// ==========================
// 📊 KPI CONTRATOS
// ==========================
export const estadisticasContratos = query({
  args: {},
  handler: async (ctx) => {
    const contratos = await ctx.db.query("contratos").collect();
    const total = contratos.length;
    const activos = contratos.filter((c) => c.estado === "activo").length;
    const montoTotal = contratos.reduce((a, c) => a + c.monto, 0);
    return { total, activos, montoTotal };
  },
});

// ==========================
// 📎 ADJUNTOS
// ==========================
export const adjuntosPorContrato = query({
  args: { contratoId: v.id("contratos") },
  handler: async (ctx, { contratoId }) => {
    return await ctx.db
      .query("contratos_adjuntos")
      .withIndex("por_contrato", (q) => q.eq("contratoId", contratoId))
      .order("desc")
      .collect();
  },
});

export const agregarAdjunto = mutation({
  args: {
    contratoId: v.id("contratos"),
    archivoId: v.id("_storage"),
    nombre: v.optional(v.string()),
    tipo: v.optional(v.string()),
    tamanio: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const contrato = await ctx.db.get(args.contratoId);
    if (!contrato) throw new Error("Contrato inexistente");

    const anteriores = await ctx.db
      .query("contratos_adjuntos")
      .withIndex("por_contrato", (q) => q.eq("contratoId", args.contratoId))
      .collect();

    await ctx.db.insert("contratos_historial", {
      contratoId: args.contratoId,
      cambiadoEn: Date.now(),
      tipoCambio: "agregar_adjunto",
      adjuntosAnteriores: anteriores.map((a) => ({
        archivoId: a.archivoId,
        nombre: a.nombre,
        tipo: a.tipo,
        tamanio: a.tamanio,
      })),
    });

    return await ctx.db.insert("contratos_adjuntos", {
      contratoId: args.contratoId,
      archivoId: args.archivoId,
      nombre: args.nombre,
      tipo: args.tipo,
      tamanio: args.tamanio,
      subidoEn: Date.now(),
    });
  },
});

export const eliminarAdjunto = mutation({
  args: { adjuntoId: v.id("contratos_adjuntos") },
  handler: async (ctx, { adjuntoId }) => {
    const adjunto = await ctx.db.get(adjuntoId);
    if (!adjunto) throw new Error("Adjunto no encontrado");

    const anteriores = await ctx.db
      .query("contratos_adjuntos")
      .withIndex("por_contrato", (q) => q.eq("contratoId", adjunto.contratoId))
      .collect();

    await ctx.db.insert("contratos_historial", {
      contratoId: adjunto.contratoId,
      cambiadoEn: Date.now(),
      tipoCambio: "eliminar_adjunto",
      adjuntosAnteriores: anteriores.map((a) => ({
        archivoId: a.archivoId,
        nombre: a.nombre,
        tipo: a.tipo,
        tamanio: a.tamanio,
      })),
    });

    return await ctx.db.delete(adjuntoId);
  },
});

// ==========================
// 📄 HISTORIAL POR CONTRATO
// ==========================
export const historialPorContrato = query({
  args: { contratoId: v.id("contratos") },
  handler: async (ctx, { contratoId }) => {
    return await ctx.db
      .query("contratos_historial")
      .withIndex("por_contrato", (q) => q.eq("contratoId", contratoId))
      .order("desc")
      .collect();
  },
});

// ==========================
// ☁️ STORAGE (upload / url)
// ==========================
export const obtenerUrlSubida = action({
  args: {},
  handler: async (ctx) => {
    const url = await ctx.storage.generateUploadUrl();
    return url;
  },
});

export const urlArchivo = query({
  args: { archivoId: v.id("_storage") },
  handler: async (ctx, { archivoId }) => {
    const url = await ctx.storage.getUrl(archivoId);
    return url;
  },
});

// ==========================
// 📦 AGREGAR MÚLTIPLES ADJUNTOS
// ==========================
export const agregarAdjuntos = mutation({
  args: {
    contratoId: v.id("contratos"),
    archivos: v.array(
      v.object({
        archivoId: v.id("_storage"),
        nombre: v.optional(v.string()),
        tipo: v.optional(v.string()),
        tamanio: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { contratoId, archivos }) => {
    const contrato = await ctx.db.get(contratoId);
    if (!contrato) throw new Error("Contrato inexistente");

    // Validar tipos de archivo
    for (const a of archivos) {
      if (!esTipoPermitido(a.tipo, a.nombre)) {
        throw new Error(`Archivo no permitido: ${a.nombre ?? a.tipo ?? "desconocido"}`);
      }
    }

    const anteriores = await ctx.db
      .query("contratos_adjuntos")
      .withIndex("por_contrato", (q) => q.eq("contratoId", contratoId))
      .collect();

    await ctx.db.insert("contratos_historial", {
      contratoId,
      cambiadoEn: Date.now(),
      tipoCambio: "agregar_adjuntos",
      adjuntosAnteriores: anteriores.map((a) => ({
        archivoId: a.archivoId,
        nombre: a.nombre,
        tipo: a.tipo,
        tamanio: a.tamanio,
      })),
    });

    for (const a of archivos) {
      await ctx.db.insert("contratos_adjuntos", {
        contratoId,
        archivoId: a.archivoId,
        nombre: a.nombre,
        tipo: a.tipo,
        tamanio: a.tamanio,
        subidoEn: Date.now(),
      });
    }

    return { ok: true, agregados: archivos.length };
  },
});

// ==========================
// ❌ ELIMINAR CONTRATO COMPLETO
// ==========================
export const eliminarContrato = mutation({
  args: { id: v.id("contratos") },
  handler: async (ctx, { id }) => {
    const contrato = await ctx.db.get(id);
    if (!contrato) throw new Error("Contrato no encontrado");

    // Borrar adjuntos, interacciones e historial
    const adjuntos = await ctx.db
      .query("contratos_adjuntos")
      .withIndex("por_contrato", (q) => q.eq("contratoId", id))
      .collect();
    for (const a of adjuntos) await ctx.db.delete(a._id);

    const interacciones = await ctx.db
      .query("interacciones")
      .withIndex("por_contrato", (q) => q.eq("contratoId", id))
      .collect();
    for (const i of interacciones) await ctx.db.delete(i._id);

    const historial = await ctx.db
      .query("contratos_historial")
      .withIndex("por_contrato", (q) => q.eq("contratoId", id))
      .collect();
    for (const h of historial) await ctx.db.delete(h._id);

    await ctx.db.delete(id);
    return { ok: true };
  },
});

// ==========================
// 🧩 Helper
// ==========================
function esTipoPermitido(tipo?: string, nombre?: string) {
  const t = (tipo ?? "").toLowerCase();
  const n = (nombre ?? "").toLowerCase();
  const esPdf = t === "application/pdf" || n.endsWith(".pdf");
  const esImagen =
    t.startsWith("image/") ||
    /\.(png|jpg|jpeg|gif|webp|bmp|tiff|svg)$/.test(n);
  return esPdf || esImagen;
}
