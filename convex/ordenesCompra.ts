// convex/ordenesCompra.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function calcularTotales(items: Array<{
  cantidadPedida: number;
  precioUnitario: number;
  descuentoPorc?: number;
  tasaImpuesto?: number;
}>) {
  const sub = items.reduce((acc, it) => acc + it.cantidadPedida * it.precioUnitario, 0);

  const desc = items.reduce(
    (acc, it) => acc + ((it.descuentoPorc ?? 0) / 100) * (it.cantidadPedida * it.precioUnitario),
    0
  );

  const baseImponible = sub - desc;

  const imp = items.reduce((acc, it) => {
    const base = it.cantidadPedida * it.precioUnitario * (1 - (it.descuentoPorc ?? 0) / 100);
    return acc + base * ((it.tasaImpuesto ?? 0) / 100);
  }, 0);

  const total = baseImponible + imp;

  return {
    subtotal: sub,
    totalDescuento: desc,
    totalImpuestos: imp,
    totalGeneral: total,
  };
}

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

    if (estado) list = list.filter(x => x.estado === estado);
    if (proveedorId) list = list.filter(x => x.proveedorId === proveedorId);

    if (desde) {
      const d = new Date(desde).toISOString();
      list = list.filter(x => x.fechaOrden >= d);
    }
    if (hasta) {
      const h = new Date(hasta).toISOString();
      list = list.filter(x => x.fechaOrden <= h);
    }

    if (buscar) {
      const b = buscar.toLowerCase();
      list = list.filter(x =>
        [x.numeroOrden, x.notas ?? ""].join(" ").toLowerCase().includes(b)
      );
    }

    // ordenar por fecha desc
    list.sort((a, b) => (a.fechaOrden < b.fechaOrden ? 1 : -1));
    return list;
  }
});

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
  }
});

export const crear = mutation({
  args: {
    proveedorId: v.id("proveedores"),
    fechaOrden: v.string(),                 // ISO
    fechaEsperada: v.optional(v.string()),
    depositoEntregaId: v.id("depositos"),
    direccionEntrega: v.optional(v.string()),

    moneda: v.union(v.literal("ARS"), v.literal("USD")),
    tipoCambio: v.optional(v.number()),
    condicionesPago: v.optional(v.string()),
    incoterm: v.optional(v.string()),

    // sin tabla de usuarios por ahora: string libre
    compradorUsuario: v.string(),

    notas: v.optional(v.string()),
    items: v.array(v.object({
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
    }))
  },
  handler: async (ctx, a) => {
    if (a.items.length === 0) throw new Error("La orden debe tener al menos un ítem");
    if (a.items.some(i => i.cantidadPedida <= 0)) throw new Error("Las cantidades deben ser > 0");

    // numeración simple (ajusta si usás numerador global/serie)
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

      compradorUsuario: a.compradorUsuario,
      notas: a.notas,

      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    for (const it of a.items) {
      const totalLinea =
        (it.cantidadPedida * it.precioUnitario) * (1 - (it.descuentoPorc ?? 0) / 100);

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
        tasaImpuesto: it.tasaImpuesto,
        totalLinea,

        fechaNecesidad: it.fechaNecesidad,
        depositoId: it.depositoId,
        centroCosto: it.centroCosto,

        estadoLinea: "ABIERTA",
      });
    }

    return ocId;
  }
});

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
    await ctx.db.patch(id, { estado, actualizadoEn: Date.now() });
  },
});

export const recibir = mutation({
  args: {
    ocId: v.id("ordenes_compra"),
    items: v.array(v.object({
      itemId: v.id("detalle_ordenes_compra"),
      cantidad: v.number(),                 // cantidad a recibir ahora
      remito: v.optional(v.string()),
    }))
  },
  handler: async (ctx, { ocId, items }) => {
    const oc = await ctx.db.get(ocId);
    if (!oc) throw new Error("Orden de compra no encontrada");

    let todasCerradas = true;

    for (const r of items) {
      const item = await ctx.db.get(r.itemId);
      if (!item || item.ocId !== ocId) throw new Error("Ítem inválido");

      const pendiente = item.cantidadPedida - item.cantidadRecibida - item.cantidadCancelada;
      if (r.cantidad <= 0 || r.cantidad > pendiente) {
        throw new Error("Cantidad a recibir inválida");
      }

      const nuevaRec = item.cantidadRecibida + r.cantidad;
      await ctx.db.patch(r.itemId, {
        cantidadRecibida: nuevaRec,
        estadoLinea: nuevaRec >= item.cantidadPedida ? "CERRADA" : "ABIERTA",
      });

      // TODO: generar Movimiento de Entrada y actualizar stock si corresponde
    }

    const itemsActualizados = await ctx.db
      .query("detalle_ordenes_compra")
      .withIndex("por_oc", q => q.eq("ocId", ocId))
      .collect();

    for (const it of itemsActualizados) {
      const sigueAbierta = it.cantidadPedida > (it.cantidadRecibida + it.cantidadCancelada);
      if (sigueAbierta) { todasCerradas = false; break; }
    }

    await ctx.db.patch(ocId, {
      estado: todasCerradas ? "CERRADA" : "PARCIALMENTE_RECIBIDA",
      actualizadoEn: Date.now(),
    });
  }
});
