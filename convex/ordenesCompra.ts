// convex/ordenesCompra.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Redondeo 2 decimales */
function red(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
/** Normaliza alícuotas a 0 | 10.5 | 21 (por si vienen otros valores) */
function normAlic(x?: number): 0 | 10.5 | 21 {
  if (x === 21) return 21;
  if (x === 10.5) return 10.5;
  return 0;
}

/** Calcula subtotal, descuentos, impuestos y total general */
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

  const totalGeneral = baseImponible + totalImpuestos;

  return { subtotal: red(subtotal), totalDescuento: red(totalDescuento), totalImpuestos: red(totalImpuestos), totalGeneral: red(totalGeneral) };
}

/* =========================
 * LISTAR (IDs crudos)
 * ========================= */
export const listar = query({
  args: {
    estado: v.optional(v.string()),
    proveedorId: v.optional(v.id("proveedores")),
    desde: v.optional(v.string()), // ISO
    hasta: v.optional(v.string()),
    buscar: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    let list = await ctx.db.query("ordenes_compra").collect();
    const { estado, proveedorId, desde, hasta, buscar } = a;

    if (estado) list = list.filter((x) => x.estado === estado);
    if (proveedorId) list = list.filter((x) => x.proveedorId === proveedorId);

    if (desde) {
      const d = new Date(desde).toISOString();
      list = list.filter((x) => x.fechaOrden >= d);
    }
    if (hasta) {
      const h = new Date(hasta).toISOString();
      list = list.filter((x) => x.fechaOrden <= h);
    }

    if (buscar) {
      const b = buscar.toLowerCase();
      list = list.filter((x) =>
        [x.numeroOrden, x.notas ?? ""].join(" ").toLowerCase().includes(b)
      );
    }

    list.sort((a, b) => (a.fechaOrden < b.fechaOrden ? 1 : -1));
    return list;
  },
});

/* ==========================================
 * LISTAR con nombres de proveedor/deposito
 * ========================================== */
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

    const { estado, proveedorId, desde, hasta, buscar } = a;

    if (estado) list = list.filter((x) => x.estado === estado);
    if (proveedorId) list = list.filter((x) => x.proveedorId === proveedorId);
    if (desde) list = list.filter((x) => x.fechaOrden >= new Date(desde).toISOString());
    if (hasta) list = list.filter((x) => x.fechaOrden <= new Date(hasta).toISOString());
    if (buscar) {
      const b = buscar.toLowerCase();
      list = list.filter((x) =>
        [x.numeroOrden, x.notas ?? ""].join(" ").toLowerCase().includes(b)
      );
    }

    list.sort((a, b) => (a.fechaOrden < b.fechaOrden ? 1 : -1));

    // Resolver nombres relacionados
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

/* ===================================
 * OBTENER (IDs crudos)
 * =================================== */
export const obtener = query({
  args: { id: v.id("ordenes_compra") },
  handler: async (ctx, { id }) => {
    const oc = await ctx.db.get(id);
    if (!oc) throw new Error("Orden de compra no encontrada");

    const items = await ctx.db
      .query("detalle_ordenes_compra")
      .withIndex("por_oc", (q) => q.eq("ocId", id))
      .collect();

    return { oc, items };
  },
});

/* ============================================
 * OBTENER con nombres resueltos
 * ============================================ */
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
      .withIndex("por_oc", (q) => q.eq("ocId", id))
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
 * ========================= */
export const crear = mutation({
  args: {
    proveedorId: v.id("proveedores"),
    fechaOrden: v.string(), // ISO
    fechaEsperada: v.optional(v.string()),
    depositoEntregaId: v.id("depositos"),
    direccionEntrega: v.optional(v.string()),

    moneda: v.union(v.literal("ARS"), v.literal("USD")),
    tipoCambio: v.optional(v.number()),
    condicionesPago: v.optional(v.string()),
    incoterm: v.optional(v.string()),

    // por ahora texto libre
    compradorUsuario: v.string(),

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
    if (a.items.length === 0)
      throw new Error("La orden debe tener al menos un ítem");
    if (a.items.some((i) => i.cantidadPedida <= 0))
      throw new Error("Las cantidades deben ser > 0");

    // numeración simple (ajustar si usás serie/numerador externo)
    const count = (await ctx.db.query("ordenes_compra").collect()).length + 1;
    const numeroOrden = `OC-${new Date().getFullYear()}-${String(count).padStart(
      5,
      "0"
    )}`;

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

      compradorUsuario: a.compradorUsuario,
      notas: a.notas,

      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    for (const it of a.items) {
      const totalLinea =
        it.cantidadPedida * it.precioUnitario * (1 - (it.descuentoPorc ?? 0) / 100);

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
 * - Al pasar a APROBADA o ENVIADA, genera 1 factura automática si no existe
 * ========================= */
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
    await ctx.db.patch(id, { estado, actualizadoEn: ahora });

    // Consideramos "activa" a APROBADA o ENVIADA
    const esActiva = estado === "APROBADA" || estado === "ENVIADA";
    if (estado !== "ENVIADA") return;

    // ¿Ya hay factura para esta OC?
    const existentes = (await ctx.db.query("facturas_prov").collect()).filter(f => f.ocId === id);
    if (existentes.length > 0) return; // ya hay, no duplicar

    const oc = await ctx.db.get(id);
    if (!oc) return;

    const prov = await ctx.db.get(oc.proveedorId);
    if (!prov) return;

    const ocItems = await ctx.db
      .query("detalle_ordenes_compra")
      .withIndex("por_oc", (q) => q.eq("ocId", id))
      .collect();
    if (ocItems.length === 0) return;

    // Calcular líneas con cantidadPedida
    const lineas = ocItems.map((it) => {
      const desc = it.descuentoPorc ?? 0;
      const alic = normAlic(it.tasaImpuesto);
      const subtotal = it.cantidadPedida * it.precioUnitario * (1 - (desc / 100));
      const iva = subtotal * (alic / 100);
      const total = subtotal + iva;
      return {
        ocItemId: it._id,
        repuestoId: it.repuestoId,
        descripcion: it.descripcion,
        cantidad: it.cantidadPedida,
        precioUnitario: it.precioUnitario,
        descuentoPorc: desc,
        alicuotaIva: alic,
        subtotal: red(subtotal),
        ivaMonto: red(iva),
        totalLinea: red(total),
      };
    });

    const neto = red(lineas.reduce((a, l) => a + l.subtotal, 0));
    const iva21 = red(lineas.filter(l => l.alicuotaIva === 21).reduce((a, l) => a + l.ivaMonto, 0));
    const iva105 = red(lineas.filter(l => l.alicuotaIva === 10.5).reduce((a, l) => a + l.ivaMonto, 0));
    const total = red(lineas.reduce((a, l) => a + l.totalLinea, 0));

    // Crear factura automática (placeholder en numeroProveedor)
    const numeroProveedor = `AUTO-${new Date().getFullYear()}-${String(ahora).slice(-6)}`;

    const facturaId = await ctx.db.insert("facturas_prov", {
      ocId: id,
      proveedorId: oc.proveedorId,
      proveedorNombre: (prov as any)?.nombre ?? "",

      numeroProveedor,
      puntoVenta: undefined,
      tipo: undefined,

      fechaEmision: new Date().toISOString(),
      fechaVencimiento: undefined,

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

      notas: `Generada automáticamente al activar OC ${oc.numeroOrden}`,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

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
  },
});

/* =========================
 * RECEPCIÓN PARCIAL / SIMPLE
 * ========================= */
export const recibir = mutation({
  args: {
    ocId: v.id("ordenes_compra"),
    items: v.array(
      v.object({
        itemId: v.id("detalle_ordenes_compra"),
        cantidad: v.number(), // a recibir ahora
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

      // Aquí podrías crear un movimiento de stock de entrada
    }

    const itemsActualizados = await ctx.db
      .query("detalle_ordenes_compra")
      .withIndex("por_oc", (q) => q.eq("ocId", ocId))
      .collect();

    for (const it of itemsActualizados) {
      const sigueAbierta =
        it.cantidadPedida > it.cantidadRecibida + it.cantidadCancelada;
      if (sigueAbierta) {
        todasCerradas = false;
        break;
      }
    }

    await ctx.db.patch(ocId, {
      estado: todasCerradas ? "CERRADA" : "PARCIALMENTE_RECIBIDA",
      actualizadoEn: Date.now(),
    });
  },
});
