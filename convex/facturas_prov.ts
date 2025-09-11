// convex/facturas_prov.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/* =========================================================
 * Helpers
 * =======================================================*/
function red(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

type AlicIva = 0 | 10.5 | 21;

function calcLinea(
  cantidad: number,
  precioUnitario: number,
  descuentoPorc: number,
  alicuotaIva: AlicIva
) {
  const subtotal = cantidad * precioUnitario * (1 - (descuentoPorc ?? 0) / 100);
  const ivaMonto = subtotal * ((alicuotaIva ?? 0) / 100);
  const totalLinea = subtotal + ivaMonto;
  return {
    subtotal: red(subtotal),
    ivaMonto: red(ivaMonto),
    totalLinea: red(totalLinea),
  };
}

function sumarTotalesLineas(
  lines: Array<{ subtotal: number; ivaMonto: number; totalLinea: number; alicuotaIva: AlicIva }>
) {
  const neto = red(lines.reduce((a, l) => a + l.subtotal, 0));
  const iva21 = red(lines.filter(l => l.alicuotaIva === 21).reduce((a, l) => a + l.ivaMonto, 0));
  const iva105 = red(lines.filter(l => l.alicuotaIva === 10.5).reduce((a, l) => a + l.ivaMonto, 0));
  const total = red(lines.reduce((a, l) => a + l.totalLinea, 0));
  return { neto, iva21, iva105, total };
}

/* =========================================================
 * LISTAR (con filtros)
 * =======================================================*/
export const listar = query({
  args: {
    proveedorId: v.optional(v.id("proveedores")),
    estado: v.optional(
      v.union(
        v.literal("PENDIENTE"),
        v.literal("PARCIAL"),
        v.literal("PAGADA"),
        v.literal("ANULADA")
      )
    ),
    desde: v.optional(v.string()), // ISO
    hasta: v.optional(v.string()), // ISO
    buscar: v.optional(v.string()), // por numeroProveedor / notas
  },
  handler: async (ctx, a) => {
    let list = await ctx.db
      .query("facturas_prov")
      .withIndex("byFechaEmision")
      .collect();

    if (a.proveedorId) list = list.filter(f => f.proveedorId === a.proveedorId);
    if (a.estado) list = list.filter(f => f.estado === a.estado);

    const desdeISO = a.desde ? new Date(a.desde).toISOString() : undefined;
    const hastaISO = a.hasta ? new Date(a.hasta).toISOString() : undefined;

    if (desdeISO) list = list.filter(f => f.fechaEmision >= desdeISO);
    if (hastaISO) list = list.filter(f => f.fechaEmision <= hastaISO);

    if (a.buscar?.trim()) {
      const b = a.buscar.toLowerCase();
      list = list.filter(f =>
        [f.numeroProveedor, f.notas ?? ""].join(" ").toLowerCase().includes(b)
      );
    }

    // Orden por fecha desc (ISO compara bien)
    list.sort((x, y) => (x.fechaEmision < y.fechaEmision ? 1 : -1));
    return list;
  },
});

/* =========================================================
 * OBTENER (cabecera + items)
 * =======================================================*/
export const obtener = query({
  args: { id: v.id("facturas_prov") },
  handler: async (ctx, { id }) => {
    const fac = await ctx.db.get(id);
    if (!fac) throw new Error("Factura no encontrada");

    const items = await ctx.db
      .query("facturas_prov_items")
      .withIndex("byFactura", q => q.eq("facturaId", id))
      .collect();

    return { fac, items };
  },
});

/* =========================================================
 * CREAR DESDE OC
 * - Crea cabecera e items copiando desde la OC
 * - Usa cantidadPedida para el valor de la línea
 * =======================================================*/
export const crearDesdeOC = mutation({
  args: {
    ocId: v.id("ordenes_compra"),
    numeroProveedor: v.string(),
    fechaEmision: v.string(),                 // ISO
    fechaVencimiento: v.optional(v.string()), // ISO
    notas: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const oc = await ctx.db.get(a.ocId);
    if (!oc) throw new Error("OC no encontrada");

    const proveedor = await ctx.db.get(oc.proveedorId);
    if (!proveedor) throw new Error("Proveedor no encontrado");

    const ocItems = await ctx.db
      .query("detalle_ordenes_compra")
      .withIndex("por_oc", q => q.eq("ocId", a.ocId))
      .collect();

    if (ocItems.length === 0) throw new Error("La OC no tiene ítems");

    // Mapear ítems OC -> líneas de factura (cantidadPedida)
    const lineas = ocItems.map(it => {
      const descuento = it.descuentoPorc ?? 0;
      const alic = (it.tasaImpuesto ?? 0) as AlicIva;
      const { subtotal, ivaMonto, totalLinea } = calcLinea(
        it.cantidadPedida,
        it.precioUnitario,
        descuento,
        alic
      );
      return {
        ocItemId: it._id,
        repuestoId: it.repuestoId,
        descripcion: it.descripcion,
        cantidad: it.cantidadPedida,
        precioUnitario: it.precioUnitario,
        descuentoPorc: descuento,
        alicuotaIva: alic,
        subtotal,
        ivaMonto,
        totalLinea,
      };
    });

    const { neto, iva21, iva105, total } = sumarTotalesLineas(
      lineas.map(l => ({
        subtotal: l.subtotal,
        ivaMonto: l.ivaMonto,
        totalLinea: l.totalLinea,
        alicuotaIva: l.alicuotaIva,
      }))
    );

    const ahora = Date.now();

    // Cabecera
    const facturaId = await ctx.db.insert("facturas_prov", {
      ocId: a.ocId,
      proveedorId: oc.proveedorId,
      proveedorNombre: proveedor.nombre,

      numeroProveedor: a.numeroProveedor,
      puntoVenta: undefined,
      tipo: undefined,

      fechaEmision: new Date(a.fechaEmision).toISOString(),
      fechaVencimiento: a.fechaVencimiento
        ? new Date(a.fechaVencimiento).toISOString()
        : undefined,

      moneda: oc.moneda,
      tipoCambio: oc.tipoCambio,
      neto,
      iva21,
      iva105,
      otrosImpuestos: 0,
      total,
      saldo: total,

      estado: "PENDIENTE",
      cae: undefined,
      caeVto: undefined,

      notas: a.notas,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    // Ítems
    for (const l of lineas) {
      await ctx.db.insert("facturas_prov_items", {
        facturaId,
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

    return facturaId;
  },
});

/* =========================================================
 * LISTAR FACTURAS DE UNA OC + SUMAS
 * =======================================================*/
export const listarDeOC = query({
  args: { ocId: v.id("ordenes_compra") },
  handler: async (ctx, { ocId }) => {
    // Si tienes índice byOc, puedes reemplazar por withIndex("byOc", q => q.eq("ocId", ocId))
    let facturas = (await ctx.db.query("facturas_prov").collect()).filter(f => f.ocId === ocId);
    facturas.sort((a, b) => (a.fechaEmision < b.fechaEmision ? 1 : -1));

    const sumTotal = facturas.reduce((a, f) => a + (f.total ?? 0), 0);
    const sumSaldo = facturas.reduce((a, f) => a + (f.saldo ?? 0), 0);

    return { facturas, sumTotal, sumSaldo };
  },
});

/* =========================================================
 * RESUMEN FINANCIERO DE UNA OC
 * =======================================================*/
export const resumenDeOC = query({
  args: { ocId: v.id("ordenes_compra") },
  handler: async (ctx, { ocId }) => {
    const oc = await ctx.db.get(ocId);
    if (!oc) throw new Error("OC no encontrada");

    const facturas = (await ctx.db.query("facturas_prov").collect()).filter(f => f.ocId === ocId);

    const facturado = facturas.reduce((a, f) => a + (f.total ?? 0), 0);
    const pagado = facturas.reduce((a, f) => a + ((f.total ?? 0) - (f.saldo ?? 0)), 0);
    const saldoAPagar = facturas.reduce((a, f) => a + (f.saldo ?? 0), 0);

    return {
      oc,
      totalOC: oc.totalGeneral ?? 0,
      facturado,
      pagado,
      saldoAPagar,
      cantidadFacturas: facturas.length,
    };
  },
});

/* =========================================================
 * REGISTRAR PAGO / RETENCIONES
 * - Inserta pago, actualiza saldo/estado
 * - Si todas las facturas de la OC quedan en $0, cierra la OC
 * =======================================================*/
export const registrarPago = mutation({
  args: {
    facturaId: v.id("facturas_prov"),
    fechaPago: v.string(), // ISO
    medio: v.union(
      v.literal("TRANSFERENCIA"),
      v.literal("EFECTIVO"),
      v.literal("CHEQUE"),
      v.literal("TARJETA"),
      v.literal("OTRO")
    ),
    importe: v.number(),
    retIva: v.optional(v.number()),
    retGanancias: v.optional(v.number()),
    retIIBB: v.optional(v.number()),
    referencia: v.optional(v.string()),
    notas: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const fac = await ctx.db.get(a.facturaId);
    if (!fac) throw new Error("Factura no encontrada");
    if (fac.estado === "ANULADA")
      throw new Error("No se puede pagar una factura anulada");

    const ahora = Date.now();

    await ctx.db.insert("pagos_prov", {
      facturaId: a.facturaId,
      fechaPago: new Date(a.fechaPago).toISOString(),
      medio: a.medio,
      importe: a.importe,
      retIva: a.retIva,
      retGanancias: a.retGanancias,
      retIIBB: a.retIIBB,
      referencia: a.referencia,
      notas: a.notas,
      creadoEn: ahora,
    });

    const retTotal = (a.retIva ?? 0) + (a.retGanancias ?? 0) + (a.retIIBB ?? 0);
    const nuevoSaldo = Math.max(0, red(fac.saldo - a.importe - retTotal));

    const nuevoEstado: "PENDIENTE" | "PARCIAL" | "PAGADA" =
      nuevoSaldo === 0
        ? "PAGADA"
        : nuevoSaldo < fac.total
        ? "PARCIAL"
        : "PENDIENTE";

    await ctx.db.patch(a.facturaId, {
      saldo: nuevoSaldo,
      estado: nuevoEstado,
      actualizadoEn: ahora,
    });

    // Si la factura está vinculada a una OC, revisar si debemos cerrarla
    if (fac.ocId) {
      // Traer todas las facturas de la misma OC y sumar saldos
      const todas = (await ctx.db.query("facturas_prov").collect()).filter(f => f.ocId === fac.ocId);
      const saldoAPagar = todas.reduce((acc, f) => acc + (f.saldo ?? 0), 0);

      if (saldoAPagar === 0) {
        await ctx.db.patch(fac.ocId, { estado: "CERRADA", actualizadoEn: Date.now() });
      }
    }
  },
});

/* =========================================================
 * ANULAR
 * =======================================================*/
export const anular = mutation({
  args: { facturaId: v.id("facturas_prov"), motivo: v.optional(v.string()) },
  handler: async (ctx, { facturaId, motivo }) => {
    const fac = await ctx.db.get(facturaId);
    if (!fac) throw new Error("Factura no encontrada");

    await ctx.db.patch(facturaId, {
      estado: "ANULADA",
      saldo: 0,
      notas: motivo ?? fac.notas,
      actualizadoEn: Date.now(),
    });
  },
});

/* =========================================================
 * (Opcional) ¿Qué hay que pagar hasta una fecha?
 * =======================================================*/
export const aPagar = query({
  args: {
    hasta: v.optional(v.string()), // ISO
    proveedorId: v.optional(v.id("proveedores")),
  },
  handler: async (ctx, { hasta, proveedorId }) => {
    const pendientes = await ctx.db
      .query("facturas_prov")
      .withIndex("byEstado", q => q.eq("estado", "PENDIENTE"))
      .collect();
    const parciales = await ctx.db
      .query("facturas_prov")
      .withIndex("byEstado", q => q.eq("estado", "PARCIAL"))
      .collect();

    let list = pendientes.concat(parciales);

    if (proveedorId) list = list.filter(f => f.proveedorId === proveedorId);
    if (hasta) {
      const h = new Date(hasta).toISOString();
      list = list.filter(f => !f.fechaVencimiento || f.fechaVencimiento <= h);
    }

    list.sort((a, b) => ((a.fechaVencimiento ?? a.fechaEmision) < (b.fechaVencimiento ?? b.fechaEmision) ? -1 : 1));
    const totalSaldo = list.reduce((a, f) => a + (f.saldo ?? 0), 0);
    return { list, totalSaldo };
  },
});
