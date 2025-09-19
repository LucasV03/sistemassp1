// convex/comprobantes_prov.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const crear = mutation({
  args: {
    proveedorId: v.id("proveedores"),
    tipoComprobanteId: v.id("tipos_comprobante"),
    letra: v.string(),
    sucursal: v.string(),
    numero: v.string(),
    fecha: v.string(),
    items: v.array(
      v.object({
        repuestoId: v.id("repuestos"),
        cantidad: v.number(),
        precioUnitario: v.number(),
      })
    ),
  },
  handler: async (ctx, a) => {
    const ahora = Date.now();

    // calcular totales
    const detalle = a.items.map(i => ({
      ...i,
      subtotal: i.cantidad * i.precioUnitario,
    }));
    const total = detalle.reduce((acc, i) => acc + i.subtotal, 0);

    const compId = await ctx.db.insert("comprobantes_prov", {
      proveedorId: a.proveedorId,
      tipoComprobanteId: a.tipoComprobanteId,
      letra: a.letra,
      sucursal: a.sucursal.padStart(4, "0"),
      numero: a.numero.padStart(8, "0"),
      fecha: new Date(a.fecha).toISOString(),
      total,
      saldo: total,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    for (const d of detalle) {
      await ctx.db.insert("detalle_comprobantes_prov", {
        comprobanteId: compId,
        repuestoId: d.repuestoId,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        subtotal: d.subtotal,
      });
    }

    return compId;
  },
});


export const listar = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("comprobantes_prov").collect();
  },
});

export const obtener = query({
  args: { id: v.id("comprobantes_prov") },
  handler: async (ctx, { id }) => {
    const cabecera = await ctx.db.get(id);
    if (!cabecera) throw new Error("Comprobante no encontrado");
    const detalle = await ctx.db
      .query("detalle_comprobantes_prov")
      .withIndex("byComprobante", q => q.eq("comprobanteId", id))
      .collect();
    return { cabecera, detalle };
  },
});