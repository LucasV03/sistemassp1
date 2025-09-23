// ARCHIVO: convex/notasFinancieras.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// =========================
// MUTATIONS
// =========================

// Registrar (crear) una nota financiera vinculada a un cliente y contrato
export const registrar = mutation({
  args: {
    clienteId: v.id("clientes"),
    contratoId: v.id("contratos"),
    tipo: v.union(v.literal("credito"), v.literal("debito")),
    monto: v.number(),
    motivo: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notas_financieras", {
      ...args,
      generadoEn: Date.now(),
    });
  },
});

// =========================
// QUERIES
// =========================

// Listar notas financieras por cliente
export const porCliente = query({
  args: { clienteId: v.id("clientes") },
  handler: async (ctx, { clienteId }) => {
    return await ctx.db
      .query("notas_financieras")
      .withIndex("por_cliente", (q) => q.eq("clienteId", clienteId))
      .order("desc")
      .collect();
  },
});

// Listar notas financieras por contrato
export const porContrato = query({
  args: { contratoId: v.id("contratos") },
  handler: async (ctx, { contratoId }) => {
    return await ctx.db
      .query("notas_financieras")
      .withIndex("por_contrato", (q) => q.eq("contratoId", contratoId))
      .order("desc")
      .collect();
  },
});
