import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({






  // ==== REPUESTOS (ajustamos para stock distribuido) ====
  repuestos: defineTable({
    codigo: v.string(),
    nombre: v.string(),
    descripcion: v.optional(v.string()),
    categoria: v.string(),
    vehiculo: v.string(),
    marca: v.optional(v.string()),
    modeloCompatible: v.optional(v.string()),
    precioUnitario: v.number(),
    
  })
    .index("byCodigo", ["codigo"])
    .index("byNombre", ["nombre"])
    .index("byMarca", ["marca"])
    .index("byCategoria", ["categoria"])
    .index("byVehiculo", ["vehiculo"]),

  // ==== NUEVAS TABLAS ====
  depositos: defineTable({
    nombre: v.string(),
    provincia: v.string(),
    ciudad: v.string(),
    calle: v.string(),
    codigoPostal: v.string(),
    capacidad_total: v.optional(v.number()),
    
  })
    .index("byNombre", ["nombre"])
    .index("byProvincia", ["provincia"])
    .index("byCiudad", ["ciudad"])
    .index("byCalle", ["calle"])
    .index("byCodigoPostal", ["codigoPostal"]),

  repuestos_por_deposito: defineTable({
    repuestoId: v.id("repuestos"),
    depositoId: v.id("depositos"),
    stock_actual: v.number(),
    stock_minimo: v.optional(v.number()),
    stock_maximo: v.optional(v.number()),
    capacidad_maxima: v.optional(v.number()),
  })
    .index("byDeposito", ["depositoId"])
    .index("byRepuesto", ["repuestoId"]),

  tipos_movimiento: defineTable({
    nombre: v.string(), // Ej: "Transferencia", "Compra", "Consumo"
    ingreso_egreso: v.union(v.literal("ingreso"), v.literal("egreso")),
  }),

  tipos_comprobante: defineTable({
    nombre: v.string(), // Ej: "Remito", "Orden de compra"
  }),

  movimientos_stock: defineTable({
    depositoId: v.id("depositos"),
    tipoComprobanteId: v.id("tipos_comprobante"),
    tipoMovimientoId: v.id("tipos_movimiento"),
    fecha_registro: v.string(),
    hora_registro: v.string(),
    confirmado: v.boolean(),
  }).index("byDeposito", ["depositoId"]),

  detalle_movimiento: defineTable({
    movimientoId: v.id("movimientos_stock"),
    repuestoDepositoId: v.id("repuestos_por_deposito"),
    cantidad: v.number(),
    stock_previo: v.optional(v.number()),      
    stock_resultante: v.optional(v.number()),
  }).index("byMovimiento", ["movimientoId"]),

traspasos: defineTable({
    origenId: v.id("depositos"),
    destinoId: v.id("depositos"),
    fecha: v.string(),
    estado: v.string(), // pendiente | confirmado | rechazado
    usuario: v.optional(v.string()),
  }).index("byEstado", ["estado"]),

  detalle_traspaso: defineTable({
    traspasoId: v.id("traspasos"),
    repuestoId: v.id("repuestos"),
    cantidad: v.number(),
  }).index("byTraspaso", ["traspasoId"]),

  proveedores: defineTable({
    nombre: v.string(),
    contacto_principal: v.string(),
    telefono: v.string(),
    email: v.string(),
    cuit: v.string(),
    direccion: v.string(),
    activo: v.boolean(), 
    reputacion: v.optional(v.number()), 
    notas: v.optional(v.string()),
  }),

// ==== ÓRDENES DE COMPRA ====
ordenes_compra: defineTable({
  numeroOrden: v.string(),                   // "OC-2025-000123"
  proveedorId: v.id("proveedores"),
  fechaOrden: v.string(),                    // ISO
  fechaEsperada: v.optional(v.string()),     // ISO
  depositoEntregaId: v.id("depositos"),
  direccionEntrega: v.optional(v.string()),

  moneda: v.union(v.literal("ARS"), v.literal("USD")),
  tipoCambio: v.optional(v.number()),
  condicionesPago: v.optional(v.string()),
  incoterm: v.optional(v.string()),

  estado: v.union(
    v.literal("BORRADOR"),
    v.literal("PENDIENTE_APROBACION"),
    v.literal("APROBADA"),
    v.literal("ENVIADA"),
    v.literal("PARCIALMENTE_RECIBIDA"),
    v.literal("CERRADA"),
    v.literal("CANCELADA")
  ),

  subtotal: v.number(),
  totalDescuento: v.number(),
  totalImpuestos: v.number(),
  totalGeneral: v.number(),

  // Como aún no tenés tabla de usuarios, lo dejo como string para evitar el error de validación
  compradorUsuario: v.string(),

  notas: v.optional(v.string()),
  adjuntos: v.optional(v.array(v.object({ name: v.string(), url: v.string() }))),

  creadoEn: v.number(),
  actualizadoEn: v.number(),
})
.index("porNumero", ["numeroOrden"])
.index("porProveedor", ["proveedorId"])
.index("porFecha", ["fechaOrden"]),

detalle_ordenes_compra: defineTable({
  ocId: v.id("ordenes_compra"),
  repuestoId: v.id("repuestos"),

  descripcion: v.string(),
  unidadMedida: v.string(),                  // (antes uom)

  cantidadPedida: v.number(),
  cantidadRecibida: v.number(),
  cantidadCancelada: v.number(),

  precioUnitario: v.number(),
  descuentoPorc: v.optional(v.number()),
  tasaImpuesto: v.optional(v.number()),      // 0, 10.5, 21, etc.
  totalLinea: v.number(),                    // calculado

  fechaNecesidad: v.optional(v.string()),
  depositoId: v.id("depositos"),
  centroCosto: v.optional(v.string()),
  estadoLinea: v.union(
    v.literal("ABIERTA"),
    v.literal("CERRADA"),
    v.literal("CANCELADA")
  ),
})
.index("por_oc", ["ocId"]),

// === FACTURAS DE PROVEEDOR (cuentas por pagar) ===
  facturas_prov: defineTable({
    ocId: v.optional(v.id("ordenes_compra")),   // vínculo con OC (opcional)
    proveedorId: v.id("proveedores"),
    proveedorNombre: v.string(),                // denormalizado p/ listar

    numeroProveedor: v.string(),                // Nº factura prov.
    puntoVenta: v.optional(v.number()),
    tipo: v.optional(v.string()),               // "A" | "B" | "C" (si aplica)

    // Fechas ISO (siguiendo tu esquema actual)
    fechaEmision: v.string(),
    fechaVencimiento: v.optional(v.string()),

    // Moneda e importes
    moneda: v.union(v.literal("ARS"), v.literal("USD")),
    tipoCambio: v.optional(v.number()),
    neto: v.number(),
    iva21: v.optional(v.number()),
    iva105: v.optional(v.number()),
    otrosImpuestos: v.optional(v.number()),
    total: v.number(),
    saldo: v.number(),

    estado: v.union(
      v.literal("PENDIENTE"),
      v.literal("PARCIAL"),
      v.literal("PAGADA"),
      v.literal("ANULADA")
    ),

    cae: v.optional(v.string()),
    caeVto: v.optional(v.string()),

    notas: v.optional(v.string()),
    creadoEn: v.number(),
    actualizadoEn: v.number(),
  })
    .index("byProveedor", ["proveedorId"])
    .index("byFechaEmision", ["fechaEmision"])
    .index("byEstado", ["estado"])
    .index("byNumeroProveedor", ["numeroProveedor"]),

  // === Ítems de factura de proveedor ===
  facturas_prov_items: defineTable({
    facturaId: v.id("facturas_prov"),
    ocItemId: v.optional(v.id("detalle_ordenes_compra")),
    repuestoId: v.optional(v.id("repuestos")),

    descripcion: v.string(),
    cantidad: v.number(),
    precioUnitario: v.number(),
    descuentoPorc: v.optional(v.number()),
    alicuotaIva: v.union(v.literal(0), v.literal(10.5), v.literal(21)),

    subtotal: v.number(),     // cant * precio * (1 - desc%)
    ivaMonto: v.number(),
    totalLinea: v.number(),
  }).index("byFactura", ["facturaId"]),

  // === Pagos / retenciones a facturas de proveedor ===
  pagos_prov: defineTable({
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
    creadoEn: v.number(),
  }).index("byFactura", ["facturaId"]),

   // ===== CRM =====
  clientes: defineTable({
    nombre: v.string(),
    correo: v.string(),
    telefono: v.optional(v.string()),
    empresa: v.optional(v.string()),
    notas: v.optional(v.string()),
    creadoPor: v.optional(v.string()),
    creadoEn: v.number(),
  })
  .index("por_correo", ["correo"])
  .index("por_nombre", ["nombre"]),

  // Contratos (compat: campos de archivo opcionales para datos viejos)
  contratos: defineTable({
    clienteId: v.id("clientes"),
    titulo: v.string(),
    fechaInicio: v.string(),
    fechaFin: v.optional(v.string()),
    monto: v.number(),
    estado: v.string(),
    notas: v.optional(v.string()),
    creadoEn: v.number(),
    archivoId: v.optional(v.id("_storage")),
    archivoNombre: v.optional(v.string()),
    archivoTipo: v.optional(v.string()),
    archivoTamanio: v.optional(v.number()),
  })
  .index("por_cliente", ["clienteId"])
  .index("por_estado", ["estado"]),

  interacciones: defineTable({
    clienteId: v.id("clientes"),
    contratoId: v.optional(v.id("contratos")),
    tipo: v.string(),
    resumen: v.string(),
    proximaAccion: v.optional(v.string()),
    creadoEn: v.number(),
  })
  .index("por_cliente", ["clienteId"])
  .index("por_contrato", ["contratoId"])
  .index("por_proximaAccion", ["proximaAccion"]),

  // Adjuntos múltiples por contrato
  contratos_adjuntos: defineTable({
    contratoId: v.id("contratos"),
    archivoId: v.id("_storage"),
    nombre: v.optional(v.string()),
    tipo: v.optional(v.string()),
    tamanio: v.optional(v.number()),
    subidoEn: v.number(),
  })
  .index("por_contrato", ["contratoId"]),
  

  // Historial de contratos (cambios + snapshot de adjuntos)
  contratos_historial: defineTable({
    contratoId: v.id("contratos"),
    cambiadoEn: v.number(),
    estadoAnterior: v.optional(v.string()),
    montoAnterior: v.optional(v.number()),
    fechaInicioAnterior: v.optional(v.string()),
    fechaFinAnterior: v.optional(v.string()),
    notasAnteriores: v.optional(v.string()),
    // 'actualizar' | 'agregar_adjunto' | 'agregar_adjuntos' | 'eliminar_adjunto'
    tipoCambio: v.optional(v.string()),
    adjuntosAnteriores: v.optional(
      v.array(
        v.object({
          archivoId: v.id("_storage"),
          nombre: v.optional(v.string()),
          tipo: v.optional(v.string()),
          tamanio: v.optional(v.number()),
        })
      )
    ),
  })
  .index("por_contrato", ["contratoId"]),

  notas_financieras: defineTable({
  clienteId: v.id("clientes"),
  contratoId: v.id("contratos"),
  tipo: v.union(v.literal("credito"), v.literal("debito")), // crédito = a favor del cliente
  monto: v.number(),
  motivo: v.string(), // texto libre (ej: "Modificación de contrato")
  generadoEn: v.number(), // timestamp
})
.index("por_cliente", ["clienteId"])
.index("por_contrato", ["contratoId"])

  
});

