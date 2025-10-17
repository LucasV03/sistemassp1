import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/* ==========================================================
   🔹 LISTAR CONTRATOS CON NOMBRE DEL CLIENTE
   ========================================================== */
export const listarConCliente = query({
  args: {},
  handler: async (ctx) => {
    const contratos = await ctx.db.query("contratos_servicios").collect();
    const clientes = await ctx.db.query("clientes_ventas").collect();

    return contratos.map((c) => {
      const cliente = clientes.find((cl) => cl._id === c.clienteId);
      return {
        ...c,
        clienteNombre:
          cliente?.alias?.trim() ||
          cliente?.razonSocial?.trim() ||
          "—",
        clienteCuit: cliente?.cuit ?? "",
      };
    });
  },
});

/* ==========================================================
   🔹 ESTADÍSTICAS DE CONTRATOS
   ========================================================== */
export const estadisticas = query({
  args: {},
  handler: async (ctx) => {
    const contratos = await ctx.db.query("contratos_servicios").collect();

    const total = contratos.length;
    const vigentes = contratos.filter((c) => c.estado === "VIGENTE").length;
    const finalizados = contratos.filter((c) => c.estado === "FINALIZADO").length;
    const pendientes = contratos.filter((c) => c.estado === "PENDIENTE").length;

    return { total, vigentes, finalizados, pendientes };
  },
});

/* ==========================================================
   🔹 OBTENER CONTRATO POR ID
   ========================================================== */
export const obtener = query({
  args: { id: v.id("contratos_servicios") },
  handler: async (ctx, { id }) => {
    const contrato = await ctx.db.get(id);
    if (!contrato) throw new Error("Contrato no encontrado");
    return contrato;
  },
});

/* ==========================================================
   🔹 CREAR NUEVO CONTRATO DE SERVICIO
   ========================================================== */
export const crear = mutation({
  args: {
    clienteId: v.id("clientes_ventas"),
    tipo: v.string(),
    tarifaBase: v.number(),
    fechaInicio: v.string(),
    fechaFin: v.optional(v.string()),
    estado: v.string(), // "VIGENTE" | "FINALIZADO" | "PENDIENTE"
    notas: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cliente = await ctx.db.get(args.clienteId);
    if (!cliente) throw new Error("Cliente asociado no encontrado");

    // Validaciones básicas
    if (!args.tipo.trim()) throw new Error("El tipo de contrato es obligatorio");
    if (args.tarifaBase <= 0) throw new Error("La tarifa base debe ser mayor a cero");
    if (args.fechaFin && args.fechaFin < args.fechaInicio)
      throw new Error("La fecha de fin no puede ser anterior al inicio");

    // Normalización del estado
    const estado = args.estado.trim().toUpperCase();
    if (!["VIGENTE", "FINALIZADO", "PENDIENTE"].includes(estado))
      throw new Error("Estado inválido");

    const id = await ctx.db.insert("contratos_servicios", {
      clienteId: args.clienteId,
      tipo: args.tipo.trim(),
      tarifaBase: args.tarifaBase,
      fechaInicio: args.fechaInicio,
      fechaFin: args.fechaFin ?? "",
      estado,
      notas: args.notas?.trim() ?? "",
      // 🔹 Campos derivados del cliente
      clienteRazonSocial: cliente.razonSocial,
      clienteCuit: cliente.cuit,
      creadoEn: Date.now(),
      actualizadoEn: Date.now(),
    });

    return id;
  },
});

/* ==========================================================
   🔹 ACTUALIZAR CONTRATO EXISTENTE
   ========================================================== */
export const actualizar = mutation({
  args: {
    id: v.id("contratos_servicios"),
    clienteId: v.id("clientes_ventas"),
    tipo: v.string(),
    tarifaBase: v.number(),
    fechaInicio: v.string(),
    fechaFin: v.optional(v.string()),
    estado: v.string(),
    notas: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const contrato = await ctx.db.get(a.id);
    if (!contrato) throw new Error("Contrato no encontrado");

    const cliente = await ctx.db.get(a.clienteId);
    if (!cliente) throw new Error("Cliente asociado no encontrado");

    if (a.tarifaBase <= 0)
      throw new Error("La tarifa base debe ser mayor a cero");
    if (a.fechaFin && a.fechaFin < a.fechaInicio)
      throw new Error("La fecha de fin no puede ser anterior al inicio");

    const estado = a.estado.trim().toUpperCase();
    if (!["VIGENTE", "FINALIZADO", "PENDIENTE"].includes(estado))
      throw new Error("Estado inválido");

    await ctx.db.patch(a.id, {
      clienteId: a.clienteId,
      tipo: a.tipo.trim(),
      tarifaBase: a.tarifaBase,
      fechaInicio: a.fechaInicio,
      fechaFin: a.fechaFin ?? "",
      estado,
      notas: a.notas?.trim() ?? "",
      clienteRazonSocial: cliente.razonSocial,
      clienteCuit: cliente.cuit,
      actualizadoEn: Date.now(),
    });

    return { ok: true };
  },
});

/* ==========================================================
   🔹 ELIMINAR CONTRATO
   ========================================================== */
export const eliminar = mutation({
  args: { id: v.id("contratos_servicios") },
  handler: async (ctx, { id }) => {
    const contrato = await ctx.db.get(id);
    if (!contrato) throw new Error("Contrato no encontrado");

    await ctx.db.delete(id);
    return { ok: true };
  },
});
