// ==========================
// ARCHIVO: convex/contratos.ts
// ==========================

import { queryGeneric, mutationGeneric } from "convex/server";
import { action } from "./_generated/server"; // 👈 action desde _generated
import { v } from "convex/values";

// Validación fechas
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

// Crear contrato
export const crearContrato = mutationGeneric({
  args: {
    clienteId: v.id("clientes"),
    titulo: v.string(),
    fechaInicio: v.string(),
    fechaFin: v.optional(v.string()),
    monto: v.number(),
    estado: v.string(), // 'pendiente' | 'activo' | 'finalizado' | 'cancelado'
    notas: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const cliente = await ctx.db.get(args.clienteId);
    if (!cliente) throw new Error("Cliente inexistente");

    if (!fechasValidas(args.fechaInicio, args.fechaFin)) {
      throw new Error("Fechas de contrato inválidas (fin no puede ser anterior al inicio).");
    }

    return await ctx.db.insert("contratos", { ...args, creadoEn: Date.now() });
  },
});

// Actualizar contrato (guarda historial de valores anteriores)
export const actualizarContrato = mutationGeneric({
  args: {
    id: v.id("contratos"),
    titulo: v.string(),
    fechaInicio: v.string(),
    fechaFin: v.optional(v.string()),
    monto: v.number(),
    estado: v.string(),
    notas: v.optional(v.string()),
  },
  handler: async (ctx: any, { id, ...cambios }: any) => {
    const existente = await ctx.db.get(id);
    if (!existente) throw new Error("Contrato no encontrado");

    if (!fechasValidas(cambios.fechaInicio, cambios.fechaFin)) {
      throw new Error("Fechas de contrato inválidas (fin no puede ser anterior al inicio).");
    }

    // Historial con valores previos (tipoCambio 'actualizar')
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

// Listar contratos por cliente
export const contratosPorCliente = queryGeneric({
  args: { clienteId: v.id("clientes") },
  handler: async (ctx: any, { clienteId }: any) => {
    return await ctx.db
      .query("contratos")
      .withIndex("por_cliente", (q: any) => q.eq("clienteId", clienteId))
      .order("desc")
      .collect();
  },
});

// KPIs
export const estadisticasContratos = queryGeneric({
  args: {},
  handler: async (ctx: any) => {
    const contratos = await ctx.db.query("contratos").collect();
    const total = contratos.length;
    const activos = contratos.filter((c: any) => c.estado === "activo").length;
    const montoTotal = contratos.reduce((a: number, c: any) => a + c.monto, 0);
    return { total, activos, montoTotal };
  },
});

// ===== Adjuntos =====

// Listar adjuntos por contrato
export const adjuntosPorContrato = queryGeneric({
  args: { contratoId: v.id("contratos") },
  handler: async (ctx: any, { contratoId }: any) => {
    return await ctx.db
      .query("contratos_adjuntos")
      .withIndex("por_contrato", (q: any) => q.eq("contratoId", contratoId))
      .order("desc")
      .collect();
  },
});

// Agregar adjunto (se llama tras subir al storage)
export const agregarAdjunto = mutationGeneric({
  args: {
    contratoId: v.id("contratos"),
    archivoId: v.id("_storage"),
    nombre: v.optional(v.string()),
    tipo: v.optional(v.string()),
    tamanio: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const contrato = await ctx.db.get(args.contratoId);
    if (!contrato) throw new Error("Contrato inexistente");

    // Snapshot de adjuntos anteriores
    const anteriores = await ctx.db
      .query("contratos_adjuntos")
      .withIndex("por_contrato", (q: any) => q.eq("contratoId", args.contratoId))
      .collect();

    await ctx.db.insert("contratos_historial", {
      contratoId: args.contratoId,
      cambiadoEn: Date.now(),
      tipoCambio: "agregar_adjunto",
      adjuntosAnteriores: anteriores.map((a: any) => ({
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

// Eliminar adjunto
export const eliminarAdjunto = mutationGeneric({
  args: { adjuntoId: v.id("contratos_adjuntos") },
  handler: async (ctx: any, { adjuntoId }: any) => {
    const adjunto = await ctx.db.get(adjuntoId);
    if (!adjunto) throw new Error("Adjunto no encontrado");

    // Snapshot de adjuntos anteriores
    const anteriores = await ctx.db
      .query("contratos_adjuntos")
      .withIndex("por_contrato", (q: any) => q.eq("contratoId", adjunto.contratoId))
      .collect();

    await ctx.db.insert("contratos_historial", {
      contratoId: adjunto.contratoId,
      cambiadoEn: Date.now(),
      tipoCambio: "eliminar_adjunto",
      adjuntosAnteriores: anteriores.map((a: any) => ({
        archivoId: a.archivoId,
        nombre: a.nombre,
        tipo: a.tipo,
        tamanio: a.tamanio,
      })),
    });

    // (Opcional) también podrías borrar del storage con ctx.storage.delete(a.archivoId)
    return await ctx.db.delete(adjuntoId);
  },
});

// Historial por contrato
export const historialPorContrato = queryGeneric({
  args: { contratoId: v.id("contratos") },
  handler: async (ctx: any, { contratoId }: any) => {
    return await ctx.db
      .query("contratos_historial")
      .withIndex("por_contrato", (q: any) => q.eq("contratoId", contratoId))
      .order("desc")
      .collect();
  },
});

// Storage: URL de subida y de lectura
export const obtenerUrlSubida = action({
  args: {},
  handler: async (ctx: any) => {
    const url = await ctx.storage.generateUploadUrl();
    return url;
  },
});

export const urlArchivo = queryGeneric({
  args: { archivoId: v.id("_storage") },
  handler: async (ctx: any, { archivoId }: any) => {
    const url = await ctx.storage.getUrl(archivoId);
    return url;
  },
});


export const agregarAdjuntos = mutationGeneric({
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
  handler: async (ctx: any, { contratoId, archivos }: any) => {
    const contrato = await ctx.db.get(contratoId);
    if (!contrato) throw new Error("Contrato inexistente");

    // ❗ seguridad: validar tipos
    for (const a of archivos) {
      if (!esTipoPermitido(a.tipo, a.nombre)) {
        throw new Error(`Tipo de archivo no permitido: ${a.nombre ?? a.tipo ?? "desconocido"}`);
      }
    }

    const anteriores = await ctx.db
      .query("contratos_adjuntos")
      .withIndex("por_contrato", (q: any) => q.eq("contratoId", contratoId))
      .collect();

    await ctx.db.insert("contratos_historial", {
      contratoId,
      cambiadoEn: Date.now(),
      tipoCambio: "agregar_adjuntos",
      adjuntosAnteriores: anteriores.map((a: any) => ({
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


export const eliminarContrato = mutationGeneric({
  args: { id: v.id("contratos") },
  handler: async (ctx: any, { id }: any) => {
    const contrato = await ctx.db.get(id);
    if (!contrato) throw new Error("Contrato no encontrado");

    // Borrar adjuntos
    const adjuntos = await ctx.db
      .query("contratos_adjuntos")
      .withIndex("por_contrato", (q: any) => q.eq("contratoId", id))
      .collect();
    for (const a of adjuntos) {
      await ctx.db.delete(a._id);
    }

    // Borrar interacciones
    const interacciones = await ctx.db
      .query("interacciones")
      .withIndex("por_contrato", (q: any) => q.eq("contratoId", id))
      .collect();
    for (const i of interacciones) {
      await ctx.db.delete(i._id);
    }

    // Borrar historial
    const historial = await ctx.db
      .query("contratos_historial")
      .withIndex("por_contrato", (q: any) => q.eq("contratoId", id))
      .collect();
    for (const h of historial) {
      await ctx.db.delete(h._id);
    }

    // Borrar contrato
    await ctx.db.delete(id);

    return { ok: true };
  },
});

function esTipoPermitido(tipo?: string, nombre?: string) {
  const t = (tipo ?? "").toLowerCase();
  const n = (nombre ?? "").toLowerCase();

  const esPdf = t === "application/pdf" || n.endsWith(".pdf");
  const esImagen = t.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|bmp|tiff|svg)$/.test(n);

  return esPdf || esImagen;
}