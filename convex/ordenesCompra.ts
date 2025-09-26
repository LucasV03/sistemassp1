// convex/ordenesCompra.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* =========================
 * Helpers
 * =======================*/
const red = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const normAlic = (x?: number): 0 | 10.5 | 21 =>
  x === 21 ? 21 : x === 10.5 ? 10.5 : 0;

/** vencimiento = fecha + N meses (clamp fin de mes) */
function addMonthsClamp(dateIso: string, months = 1) {
  const d = new Date(dateIso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

/** Totales OC */
function calcularTotales(items: Array<{
  cantidadPedida: number;
  precioUnitario: number;
  descuentoPorc?: number;
  tasaImpuesto?: number;
}>) {
  const subtotal = items.reduce(
    (acc, it) => acc + it.cantidadPedida * it.precioUnitario,
    0
  );
  const totalDescuento = items.reduce(
    (acc, it) =>
      acc +
      ((it.descuentoPorc ?? 0) / 100) * (it.cantidadPedida * it.precioUnitario),
    0
  );
  const baseImponible = subtotal - totalDescuento;
  const totalImpuestos = items.reduce((acc, it) => {
    const base =
      it.cantidadPedida *
      it.precioUnitario *
      (1 - (it.descuentoPorc ?? 0) / 100);
    return acc + base * ((normAlic(it.tasaImpuesto) ?? 0) / 100);
  }, 0);

  return {
    subtotal: red(subtotal),
    totalDescuento: red(totalDescuento),
    totalImpuestos: red(totalImpuestos),
    totalGeneral: red(baseImponible + totalImpuestos),
  };
}

/* =========================
 * LISTAR / LISTAR con nombres
 * =======================*/
export const listar = query({
  args: {
    estado: v.optional(v.string()),
    proveedorId: v.optional(v.id("proveedores")),
    desde: v.optional(v.string()),
    hasta: v.optional(v.string()),
    buscar: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    let list = await ctx.db.query("ordenes_compra").collect();

    if (a.estado) list = list.filter(x => x.estado === a.estado);
    if (a.proveedorId) list = list.filter(x => x.proveedorId === a.proveedorId);
    if (a.desde) {
      const d = new Date(a.desde).toISOString();
      list = list.filter(x => x.fechaOrden >= d);
    }
    if (a.hasta) {
      const h = new Date(a.hasta).toISOString();
      list = list.filter(x => x.fechaOrden <= h);
    }
    if (a.buscar) {
      const b = a.buscar.toLowerCase();
      list = list.filter(x =>
        [x.numeroOrden, x.notas ?? ""].join(" ").toLowerCase().includes(b)
      );
    }

    list.sort((a, b) => (a.fechaOrden < b.fechaOrden ? 1 : -1));
    return list;
  },
});

export const listarConNombres = query({
  args: {
    estado: v.optional(v.string()),
    proveedorId: v.optional(v.id("proveedores")),
    desde: v.optional(v.string()),
    hasta: v.optional(v.string()),
    buscar: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    let list = await ctx.db.query("ordenes_compra").collect();

    if (a.estado) list = list.filter(x => x.estado === a.estado);
    if (a.proveedorId) list = list.filter(x => x.proveedorId === a.proveedorId);
    if (a.desde) list = list.filter(x => x.fechaOrden >= new Date(a.desde!).toISOString());
    if (a.hasta) list = list.filter(x => x.fechaOrden <= new Date(a.hasta!).toISOString());
    if (a.buscar) {
      const b = a.buscar.toLowerCase();
      list = list.filter(x =>
        [x.numeroOrden, x.notas ?? ""].join(" ").toLowerCase().includes(b)
      );
    }

    list.sort((a, b) => (a.fechaOrden < b.fechaOrden ? 1 : -1));

    return await Promise.all(
      list.map(async (oc) => {
        const [prov, depo] = await Promise.all([
          ctx.db.get(oc.proveedorId),
          ctx.db.get(oc.depositoEntregaId),
        ]);
        return {
          ...oc,
          proveedorNombre: prov?.nombre ?? "(Proveedor desconocido)",
          depositoNombre: depo?.nombre ?? "(Depósito desconocido)",
        };
      })
    );
  },
});

/* =========================
 * OBTENER / OBTENER con nombres
 * =======================*/
export const obtener = query({
  args: { id: v.id("ordenes_compra") },
  handler: async (ctx, { id }) => {
    const oc = await ctx.db.get(id);
    if (!oc) throw new Error("Orden de compra no encontrada");

    const items = await ctx.db
      .query("detalle_ordenes_compra")
      .withIndex("por_oc", q => q.eq("ocId", id))
      .collect();

    return { oc, items };
  },
});

export const obtenerConNombres = query({
  args: { id: v.id("ordenes_compra") },
  handler: async (ctx, { id }) => {
    const oc = await ctx.db.get(id);
    if (!oc) throw new Error("Orden de compra no encontrada");

    const [prov, depo] = await Promise.all([
      ctx.db.get(oc.proveedorId),
      ctx.db.get(oc.depositoEntregaId),
    ]);

    const items = await ctx.db
      .query("detalle_ordenes_compra")
      .withIndex("por_oc", q => q.eq("ocId", id))
      .collect();

    return {
      oc: {
        ...oc,
        proveedorNombre: prov?.nombre ?? "(Proveedor desconocido)",
        depositoNombre: depo?.nombre ?? "(Depósito desconocido)",
      },
      items,
    };
  },
});

/* =========================
 * CREAR
 * =======================*/
export const crear = mutation({
  args: {
    proveedorId: v.id("proveedores"),
    fechaOrden: v.string(),
    fechaEsperada: v.optional(v.string()),
    depositoEntregaId: v.id("depositos"),
    direccionEntrega: v.optional(v.string()),
    moneda: v.union(v.literal("ARS"), v.literal("USD")),
    tipoCambio: v.optional(v.number()),
    condicionesPago: v.optional(v.string()),
    incoterm: v.optional(v.string()),

    notas: v.optional(v.string()),
    items: v.array(
      v.object({
        repuestoId: v.id("repuestos"),
        descripcion: v.string(),
        unidadMedida: v.string(),
        cantidadPedida: v.number(),
        precioUnitario: v.number(),
        descuentoPorc: v.optional(v.number()),
        tasaImpuesto: v.optional(v.number()),
        depositoId: v.id("depositos"),
        fechaNecesidad: v.optional(v.string()),
        centroCosto: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, a) => {
    if (a.items.length === 0) throw new Error("La orden debe tener al menos un ítem");
    if (a.items.some(i => i.cantidadPedida <= 0)) throw new Error("Las cantidades deben ser > 0");

    const count = (await ctx.db.query("ordenes_compra").collect()).length + 1;
    const numeroOrden = `OC-${new Date().getFullYear()}-${String(count).padStart(5, "0")}`;

    const totales = calcularTotales(a.items);
    const ahora = Date.now();

    const ocId = await ctx.db.insert("ordenes_compra", {
      numeroOrden,
      proveedorId: a.proveedorId,
      fechaOrden: a.fechaOrden,
      fechaEsperada: a.fechaEsperada,
      depositoEntregaId: a.depositoEntregaId,
      direccionEntrega: a.direccionEntrega,
      moneda: a.moneda,
      tipoCambio: a.tipoCambio,
      condicionesPago: a.condicionesPago,
      incoterm: a.incoterm,
      estado: "BORRADOR",
      ...totales,
      notas: a.notas,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    for (const it of a.items) {
      const totalLinea = it.cantidadPedida * it.precioUnitario * (1 - (it.descuentoPorc ?? 0) / 100);
      await ctx.db.insert("detalle_ordenes_compra", {
        ocId,
        repuestoId: it.repuestoId,
        descripcion: it.descripcion,
        unidadMedida: it.unidadMedida,
        cantidadPedida: it.cantidadPedida,
        cantidadRecibida: 0,
        cantidadCancelada: 0,
        precioUnitario: it.precioUnitario,
        descuentoPorc: it.descuentoPorc,
        tasaImpuesto: normAlic(it.tasaImpuesto),
        totalLinea: red(totalLinea),
        fechaNecesidad: it.fechaNecesidad,
        depositoId: it.depositoId,
        centroCosto: it.centroCosto,
        estadoLinea: "ABIERTA",
      });
    }

    return ocId;
  },
});

/* =========================
 * CAMBIAR ESTADO
 * - crea factura automática SOLO al pasar a ENVIADA
 * - setea fechaVencimiento = emision + 1 mes
 * =======================*/
export const cambiarEstado = mutation({
  args: {
    id: v.id("ordenes_compra"),
    estado: v.union(
      v.literal("BORRADOR"),
      v.literal("PENDIENTE_APROBACION"),
      v.literal("APROBADA"),
      v.literal("ENVIADA"),
      v.literal("PARCIALMENTE_RECIBIDA"),
      v.literal("CERRADA"),
      v.literal("CANCELADA")
    ),
  },
  handler: async (ctx, { id, estado }) => {
    const ahora = Date.now();

    const oc = await ctx.db.get(id);
    if (!oc) throw new Error("OC no encontrada");

    // 1) actualizar estado
    await ctx.db.patch(id, { estado, actualizadoEn: ahora });

    // 2) SOLO si quedó ENVIADA, intento crear factura (si no existe)
    if (estado !== "ENVIADA") return;

    const existe = (await ctx.db.query("facturas_prov").collect()).some(f => f.ocId === id);
    if (existe) return;

    // Datos p/ factura
    const prov = await ctx.db.get(oc.proveedorId);
    const items = await ctx.db
      .query("detalle_ordenes_compra")
      .withIndex("por_oc", q => q.eq("ocId", id))
      .collect();
    if (items.length === 0) return;

    const red = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
    const normAlic = (x?: number) => (x === 21 ? 21 : x === 10.5 ? 10.5 : 0) as 0|10.5|21;
    const addMonths = (iso: string, m = 1) => { const d = new Date(iso); d.setMonth(d.getMonth()+m); return d.toISOString(); };

    const lineas = items.map(it => {
      const desc = it.descuentoPorc ?? 0;
      const alic = normAlic(it.tasaImpuesto);
      const sub  = it.cantidadPedida * it.precioUnitario * (1 - desc/100);
      const iva  = sub * (alic/100);
      return {
        ocItemId: it._id,
        repuestoId: it.repuestoId,
        descripcion: it.descripcion,
        cantidad: it.cantidadPedida,
        precioUnitario: it.precioUnitario,
        descuentoPorc: desc,
        alicuotaIva: alic,
        subtotal: red(sub),
        ivaMonto: red(iva),
        totalLinea: red(sub + iva),
      };
    });

    const neto   = red(lineas.reduce((a, l) => a + l.subtotal, 0));
    const iva21  = red(lineas.filter(l => l.alicuotaIva === 21).reduce((a, l) => a + l.ivaMonto, 0));
    const iva105 = red(lineas.filter(l => l.alicuotaIva === 10.5).reduce((a, l) => a + l.ivaMonto, 0));
    const total  = red(lineas.reduce((a, l) => a + l.totalLinea, 0));

    const emisionISO = new Date().toISOString();
    const vencISO    = addMonths(emisionISO, 1);

    const facId = await ctx.db.insert("facturas_prov", {
      ocId: id,
      proveedorId: oc.proveedorId,
      proveedorNombre: (prov as any)?.nombre ?? "",
      numeroProveedor: `AUTO-${new Date().getFullYear()}-${String(ahora).slice(-6)}`,
      fechaEmision: emisionISO,
      fechaVencimiento: vencISO,
      moneda: oc.moneda,
      tipoCambio: oc.tipoCambio,
      neto, iva21, iva105, otrosImpuestos: 0,
      total, saldo: total,
      estado: "PENDIENTE",
      notas: `Generada automáticamente al marcar OC ${oc.numeroOrden} como ENVIADA`,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    for (const l of lineas) {
      await ctx.db.insert("facturas_prov_items", {
        facturaId: facId,
        ocItemId: l.ocItemId,
        repuestoId: l.repuestoId,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        descuentoPorc: l.descuentoPorc,
        alicuotaIva: l.alicuotaIva,
        subtotal: l.subtotal,
        ivaMonto: l.ivaMonto,
        totalLinea: l.totalLinea,
      });
    }
  },
});


/* =========================
 * RECEPCIÓN
 * =======================*/
export const recibir = mutation({
  args: {
    ocId: v.id("ordenes_compra"),
    items: v.array(
      v.object({
        itemId: v.id("detalle_ordenes_compra"),
        cantidad: v.number(),
        remito: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { ocId, items }) => {
    const oc = await ctx.db.get(ocId);
    if (!oc) throw new Error("Orden de compra no encontrada");

    let todasCerradas = true;

    for (const r of items) {
      const item = await ctx.db.get(r.itemId);
      if (!item || item.ocId !== ocId) throw new Error("Ítem inválido");

      const pendiente =
        item.cantidadPedida - item.cantidadRecibida - item.cantidadCancelada;
      if (r.cantidad <= 0 || r.cantidad > pendiente) {
        throw new Error("Cantidad a recibir inválida");
      }

      const nuevaRec = item.cantidadRecibida + r.cantidad;
      await ctx.db.patch(r.itemId, {
        cantidadRecibida: nuevaRec,
        estadoLinea: nuevaRec >= item.cantidadPedida ? "CERRADA" : "ABIERTA",
      });
    }

    const itemsActualizados = await ctx.db
      .query("detalle_ordenes_compra")
      .withIndex("por_oc", q => q.eq("ocId", ocId))
      .collect();

    for (const it of itemsActualizados) {
      const abierta = it.cantidadPedida > it.cantidadRecibida + it.cantidadCancelada;
      if (abierta) { todasCerradas = false; break; }
    }

    await ctx.db.patch(ocId, {
      estado: todasCerradas ? "CERRADA" : "PARCIALMENTE_RECIBIDA",
      actualizadoEn: Date.now(),
    });
  },
});
