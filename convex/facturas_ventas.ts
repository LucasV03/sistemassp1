import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";

/* =========================================================
   🧾 CREAR FACTURA DE VENTA
   ========================================================= */
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
        viajeId: v.id("viajes"),
        descripcion: v.string(),
        cantidad: v.number(),
        precioUnitario: v.number(),
        subtotal: v.number(),
      })
    ),
    subtotal: v.number(),
    iva: v.number(),
    total: v.number(),
    estado: v.union(
      v.literal("EMITIDA"),
      v.literal("PAGADA"),
      v.literal("VENCIDA"),
      v.literal("PENDIENTE")
    ),
  },
  handler: async (ctx, a) => {
    const cliente = await ctx.db.get(a.clienteId);
    if (!cliente) throw new ConvexError("Cliente no encontrado.");

    const id = await ctx.db.insert("facturas_ventas", {
      clienteId: a.clienteId,
      contratoId: a.contratoId,
      numero: a.numero,
      tipoComprobante: a.tipoComprobante,
      fecha: a.fecha,
      hora: a.hora,
      items: a.items,
      subtotal: a.subtotal,
      iva: a.iva,
      total: a.total,
      estado: a.estado,
      creadoEn: Date.now(),
      actualizadoEn: Date.now(),
    });

    return id;
  },
});

/* =========================================================
   📋 LISTAR CON CLIENTE Y DATOS FORMATEADOS
   ========================================================= */
export const listarConCliente = query({
  args: {},
  handler: async (ctx) => {
    const facturas = await ctx.db.query("facturas_ventas").order("desc").collect();
    const clientes = await ctx.db.query("clientes_ventas").collect();

    return facturas.map((f) => {
      const cliente = clientes.find((c) => c._id === f.clienteId);
      return {
        ...f,
        clienteRazonSocial: cliente?.razonSocial ?? "—",
        clienteAlias: cliente?.alias ?? "",
        clienteCuit: cliente?.cuit ?? "—",
        totalFormateado: f.total.toLocaleString("es-AR", {
          style: "currency",
          currency: "ARS",
        }),
      };
    });
  },
});

/* =========================================================
   📊 ESTADÍSTICAS DE FACTURAS
   ========================================================= */
export const estadisticas = query({
  args: {},
  handler: async (ctx) => {
    const facturas = await ctx.db.query("facturas_ventas").collect();
    const totalFacturado = facturas.reduce((acc, f) => acc + f.total, 0);
    const emitidas = facturas.filter((f) => f.estado === "EMITIDA").length;
    const pagadas = facturas.filter((f) => f.estado === "PAGADA").length;
    const pendientes = facturas.filter((f) => f.estado === "PENDIENTE").length;
    const vencidas = facturas.filter((f) => f.estado === "VENCIDA").length;

    return {
      totalFacturado,
      emitidas,
      pagadas,
      pendientes,
      vencidas,
      totalFormateado: totalFacturado.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
      }),
    };
  },
});
