// convex/comprobantes_prov.ts
import { mutation, query } from "./_generated/server";
import { v, ConvexError} from "convex/values";
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



// =====================
// Registrar pago (una factura individual)
// =====================
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
        referencia: v.optional(v.string()),
        notas: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { comprobanteId, pagos }) => {
    const comp = await ctx.db.get(comprobanteId);
    if (!comp) throw new ConvexError("Comprobante no encontrado");

    const ahora = Date.now();
    const proveedorId = comp.proveedorId;
    const totalPagado = pagos.reduce((acc, p) => acc + p.importe, 0);

    if (totalPagado <= 0)
      throw new ConvexError("El monto total debe ser mayor a cero.");

    // Validar transferencias con referencia
    for (const p of pagos) {
      if (p.medio === "TRANSFERENCIA" && !p.referencia) {
        throw new ConvexError("La transferencia requiere un número de referencia.");
      }
    }

    // Registrar cada método de pago (un registro por método)
    for (const p of pagos) {
      await ctx.db.insert("pagos_comprobantes", {
        proveedorId,
        facturasIds: [comprobanteId], // ✅ array con una sola factura
        fechaPago: new Date().toISOString(),
        medio: p.medio,
        importe: p.importe,
        referencia: p.referencia ?? "",
        notas: p.notas ?? "",
        creadoEn: ahora,
      });
    }

    // Actualizar saldo y estado del comprobante
    const nuevoSaldo = Math.max(0, comp.saldo - totalPagado);
    const nuevoEstado =
      nuevoSaldo <= 0 ? "PAGADO" : nuevoSaldo < comp.total ? "PARCIAL" : "PENDIENTE";

    await ctx.db.patch(comprobanteId, {
      saldo: nuevoSaldo,
      estado: nuevoEstado,
      actualizadoEn: ahora,
    });

    return { nuevoSaldo, nuevoEstado };
  },
});

// =====================
// Registrar pago (múltiples facturas, sin duplicaciones)
// =====================
export const registrarPagoMultiple = mutation({
  args: {
    facturasIds: v.array(v.id("comprobantes_prov")),
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
        referencia: v.optional(v.string()),
        notas: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ahora = Date.now();
    const facturas = await Promise.all(args.facturasIds.map((id) => ctx.db.get(id)));
    const validas = facturas.filter(Boolean);

    if (validas.length === 0)
      throw new ConvexError("No se encontraron facturas válidas.");

    // Verificar proveedor común
    const proveedorId = validas[0]!.proveedorId;
    const distintos = validas.some((f) => f!.proveedorId !== proveedorId);
    if (distintos)
      throw new ConvexError("Todas las facturas deben pertenecer al mismo proveedor.");

    // Totales
    const totalFacturas = validas.reduce((a, f) => a + (f!.saldo ?? 0), 0);
    const totalPagos = args.pagos.reduce((a, p) => a + p.importe, 0);
    if (totalPagos <= 0) throw new ConvexError("El monto total debe ser mayor a cero.");
    if (totalPagos > totalFacturas)
      throw new ConvexError("El total de pagos no puede superar el saldo total.");

    // Validar transferencias
    for (const p of args.pagos) {
      if (p.medio === "TRANSFERENCIA" && !p.referencia) {
        throw new ConvexError("Las transferencias requieren un número de referencia.");
      }
    }

    // 🔹 Registrar un pago por cada método, afectando todas las facturas seleccionadas
    for (const p of args.pagos) {
      await ctx.db.insert("pagos_comprobantes", {
        proveedorId,
        facturasIds: args.facturasIds, // 👈 todas las facturas involucradas
        fechaPago: new Date().toISOString(),
        medio: p.medio,
        importe: p.importe,
        referencia: p.referencia ?? "",
        notas: p.notas ?? "",
        creadoEn: ahora,
      });
    }

    // 🔹 Distribuir el monto total proporcionalmente
    for (const f of validas) {
      const proporcion = (f!.saldo ?? 0) / totalFacturas;
      const aplicado = totalPagos * proporcion;
      const nuevoSaldo = Math.max((f!.saldo ?? 0) - aplicado, 0);
      const nuevoEstado =
        nuevoSaldo <= 0.01 ? "PAGADO" : nuevoSaldo < f!.total ? "PARCIAL" : "PENDIENTE";

      await ctx.db.patch(f!._id, {
        saldo: nuevoSaldo,
        estado: nuevoEstado,
        actualizadoEn: ahora,
      });
    }

    return { ok: true };
  },
});
