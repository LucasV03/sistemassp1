import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// MUTATION para registrar una nota financiera
export const registrar = mutation({
  args: {
    clienteId: v.id("clientes"),
    contratoId: v.id("contratos"),
    tipo: v.union(v.literal("credito"), v.literal("debito")),
    monto: v.float64(), // ✅ CORREGIDO
    motivo: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notas_financieras", { // ✅ CORREGIDO
      ...args,
      generadoEn: Date.now(),
    });
  },
});

// QUERY para traer todas las notas por cliente
export const porCliente = query({
  args: { clienteId: v.id("clientes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notas_financieras") // ✅ CORREGIDO
      .filter((q) => q.eq(q.field("clienteId"), args.clienteId))
      .order("desc")
      .collect();
  },
});
