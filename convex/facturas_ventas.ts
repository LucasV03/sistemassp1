// convex/facturas_ventas.ts
import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";

// 🔹 Listar facturas con razón social del cliente
export const listarConCliente = query({
  args: {},
  handler: async (ctx) => {
    const facturas = await ctx.db.query("facturas_ventas").order("desc").collect();
    const clientes = await ctx.db.query("clientes_ventas").collect();

    return facturas.map((f) => {
      const cliente = clientes.find((c) => c._id === f.clienteId);
      return {
        ...f,
        clienteRazonSocial: cliente ? cliente.razonSocial : "—",
        clienteAlias: cliente?.alias ?? "",
        clienteCuit: cliente?.cuit ?? "",
        totalFormateado: new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
          minimumFractionDigits: 2,
        }).format(f.total || 0),
      };
    });
  },
});

// 🔹 Crear nueva factura de venta (basado en distancias)
export const crear = mutation({
  args: {
    clienteId: v.id("clientes_ventas"),
    contratoId: v.optional(v.id("contratos_servicios")),
    numero: v.string(),
    tipoComprobante: v.union(
      v.literal("FACTURA_A"),
      v.literal("FACTURA_B"),
      v.literal("FACTURA_C")
    ),
    fecha: v.string(),
    hora: v.string(),
    items: v.array(
      v.object({
        viajeId: v.id("viajes"), // requerido por schema
        descripcion: v.string(),
        cantidad: v.number(),
        precioUnitario: v.number(),
      })
    ),
    estado: v.optional(
      v.union(
        v.literal("EMITIDA"),
        v.literal("PAGADA"),
        v.literal("VENCIDA"),
        v.literal("PENDIENTE")
      )
    ),
  },
  handler: async (ctx, a) => {
    const cliente = await ctx.db.get(a.clienteId);
    if (!cliente) throw new ConvexError("Cliente no encontrado");

    // Calcular subtotales e IVA
    const detalle = a.items.map((i) => ({
      ...i,
      subtotal: i.cantidad * i.precioUnitario,
    }));

    const subtotal = detalle.reduce((acc, i) => acc + i.subtotal, 0);
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    const facturaId = await ctx.db.insert("facturas_ventas", {
      clienteId: a.clienteId,
      contratoId: a.contratoId,
      numero: a.numero,
      tipoComprobante: a.tipoComprobante,
      fecha: a.fecha,
      hora: a.hora,
      items: detalle,
      subtotal,
      iva,
      total,
      estado: a.estado ?? "EMITIDA",
      creadoEn: Date.now(),
      actualizadoEn: Date.now(),
    });

    return facturaId;
  },
});

// 🔹 KPIs de facturación
export const estadisticas = query({
  args: {},
  handler: async (ctx) => {
    const facturas = await ctx.db.query("facturas_ventas").collect();

    const totalFacturado = facturas.reduce((acc, f) => acc + (f.total || 0), 0);
    const emitidas = facturas.length;
    const pendientes = facturas.filter(
      (f) => f.estado === "EMITIDA" || f.estado === "PENDIENTE"
    ).length;
    const vencidas = facturas.filter((f) => f.estado === "VENCIDA").length;
    const pagadas = facturas.filter((f) => f.estado === "PAGADA").length;

    return {
      totalFacturado,
      emitidas,
      pendientes,
      vencidas,
      pagadas,
      totalFormateado: new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
      }).format(totalFacturado),
    };
  },
});
