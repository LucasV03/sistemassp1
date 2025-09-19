// convex/comprobantes_prov.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
export const crear = mutation({
  args: {
    proveedorId: v.id("proveedores"),
    proveedorCuit: v.string(), // ⬅️ nuevo
    tipoComprobanteId: v.id("tipos_comprobante"),
    letra: v.string(),
    sucursal: v.string(),
    numero: v.string(),
    fecha: v.string(),
    hora: v.string(),
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

    const detalle = a.items.map((i) => ({
      ...i,
      subtotal: i.cantidad * i.precioUnitario,
    }));
    const total = detalle.reduce((acc, i) => acc + i.subtotal, 0);

    const compId = await ctx.db.insert("comprobantes_prov", {
      proveedorId: a.proveedorId,
      proveedorCuit: a.proveedorCuit, // ⬅️ nuevo
      tipoComprobanteId: a.tipoComprobanteId,
      letra: a.letra,
      sucursal: a.sucursal.padStart(4, "0"),
      numero: a.numero.padStart(8, "0"),
      fecha: new Date(a.fecha).toISOString(),
      hora: a.hora,
      total,
      saldo: total,
      estado: "PENDIENTE",
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

// =====================
// QUERIES
// =====================
export const listar = query({
  args: {},
  handler: async (ctx) => {
    const comps = await ctx.db.query("comprobantes_prov").collect();

    return await Promise.all(
      comps.map(async (c) => {
        const proveedor = await ctx.db.get(c.proveedorId);
        const tipo = await ctx.db.get(c.tipoComprobanteId);

        return {
          ...c,
          proveedorNombre: proveedor?.nombre ?? "(sin proveedor)",
          tipoComprobanteNombre: tipo?.nombre ?? "(sin tipo)",
        };
      })
    );
  },
});


export const obtener = query({
  args: { id: v.id("comprobantes_prov") },
  handler: async (ctx, { id }) => {
    const cabecera = await ctx.db.get(id);
    if (!cabecera) throw new Error("Comprobante no encontrado");

    // --- buscar datos adicionales ---
    const proveedor = cabecera.proveedorId
      ? await ctx.db.get(cabecera.proveedorId)
      : null;
    const tipoComprobante = cabecera.tipoComprobanteId
      ? await ctx.db.get(cabecera.tipoComprobanteId)
      : null;

    const detalleRaw = await ctx.db
      .query("detalle_comprobantes_prov")
      .withIndex("byComprobante", (q) => q.eq("comprobanteId", id))
      .collect();

    // enriquecer detalle con nombre de repuesto
    const detalle = await Promise.all(
      detalleRaw.map(async (d) => {
        const repuesto = await ctx.db.get(d.repuestoId);
        return {
          ...d,
          repuestoNombre: repuesto?.nombre ?? "(sin nombre)",
          repuestoCodigo: repuesto?.codigo ?? "",
        };
      })
    );

    return {
      cabecera: {
        ...cabecera,
        proveedorNombre: proveedor?.nombre ?? "(sin proveedor)",
        tipoComprobanteNombre: tipoComprobante?.nombre ?? "(sin tipo)",
      },
      detalle,
    };
  },
});

// =====================
// Próximo número
// =====================
export const proximoNumero = query({
  args: { sucursal: v.string() },
  handler: async (ctx, { sucursal }) => {
    const ult = await ctx.db
      .query("comprobantes_prov")
      .withIndex("byNumero", (q) => q.eq("sucursal", sucursal))
      .order("desc")
      .first();
    if (!ult) return "00000001";

    const actual = parseInt(ult.numero, 10);
    const siguiente = (actual + 1).toString().padStart(8, "0");
    return siguiente;
  },
});

export const registrarPago = mutation({
  args: {
    comprobanteId: v.id("comprobantes_prov"),
    pagos: v.array(
      v.object({
        medio: v.union(
          v.literal("TRANSFERENCIA"),
          v.literal("EFECTIVO"),
          v.literal("CHEQUE"),
          v.literal("TARJETA"),
          v.literal("OTRO")
        ),
        importe: v.number(),
        notas: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { comprobanteId, pagos }) => {
    const comp = await ctx.db.get(comprobanteId);
    if (!comp) throw new Error("Comprobante no encontrado");

    const ahora = Date.now();
    let totalPagado = 0;

    for (const p of pagos) {
      await ctx.db.insert("pagos_comprobantes", {
        comprobanteId,
        fechaPago: new Date().toISOString(),
        medio: p.medio,
        importe: p.importe,
        notas: p.notas,
        creadoEn: ahora,
      });
      totalPagado += p.importe;
    }

    // actualizar saldo
    const nuevoSaldo = Math.max(0, comp.saldo - totalPagado);

    let nuevoEstado: "PENDIENTE" | "PARCIAL" | "PAGADO" = "PENDIENTE";
    if (nuevoSaldo <= 0) {
      nuevoEstado = "PAGADO";
    } else if (nuevoSaldo < comp.total) {
      nuevoEstado = "PARCIAL";
    }

    await ctx.db.patch(comprobanteId, {
      saldo: nuevoSaldo,
      estado: nuevoEstado,
      actualizadoEn: ahora,
    });

    return { nuevoSaldo, nuevoEstado };
  },
});
