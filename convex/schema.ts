// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ======= MAESTRAS =======
  categorias: defineTable({
    nombre: v.string(),
    slug: v.string(),
    creadoEn: v.number(),
    actualizadoEn: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_nombre", ["nombre"]),

  marcas: defineTable({
    nombre: v.string(),
    slug: v.string(),
    creadoEn: v.number(),
    actualizadoEn: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_nombre", ["nombre"]),

vehiculos: defineTable({
  nombre: v.string(),
  marcaVehiculoId: v.id("marcas_vehiculos"), // ✅ corregido
  slug: v.string(),
  patente: v.optional(v.string()),
  tipo: v.optional(v.string()),
  capacidad: v.optional(v.number()),
  estado: v.union(
    v.literal("OPERATIVO"),
    v.literal("MANTENIMIENTO"),
    v.literal("FUERA_SERVICIO")
  ),
  creadoEn: v.number(),
  actualizadoEn: v.number(),
})
  .index("by_marcaVehiculo", ["marcaVehiculoId"])
  .index("by_estado", ["estado"]),


  
  modelos: defineTable({
    nombre: v.string(), // p.ej. "2016 2.8 TDI 4x4"
    marcaId: v.id("marcas"),
    vehiculoId: v.id("vehiculos"),
    slug: v.string(),
    claveUnica: v.string(), // `${marcaId}:${vehiculoId}:${slug}`
    creadoEn: v.number(),
    actualizadoEn: v.number(),
  })
    .index("by_vehiculo", ["vehiculoId"])
    .index("by_clave", ["claveUnica"]),

  // ======= REPUESTOS =======
  // Campos de texto (compat) + referencias por ID
  repuestos: defineTable({
    codigo: v.string(),
    nombre: v.string(),
    descripcion: v.optional(v.string()),
    categoria: v.string(),
    vehiculo: v.string(),
    marca: v.optional(v.string()),
    modeloCompatible: v.optional(v.string()),
    precioUnitario: v.optional(v.number()),

    categoriaId: v.optional(v.id("categorias")),
    marcaId: v.optional(v.id("marcas")),
    vehiculoId: v.optional(v.id("vehiculos")),
    modeloId: v.optional(v.id("modelos")),

    categoriaNombre: v.optional(v.string()),
    marcaNombre: v.optional(v.string()),
    vehiculoNombre: v.optional(v.string()),
    modeloNombre: v.optional(v.string()),

    creadoEn: v.optional(v.number()),
    actualizadoEn: v.optional(v.number()),
  })
    .index("byCodigo", ["codigo"])
    .index("byNombre", ["nombre"])
    .index("byMarca", ["marca"])
    .index("byCategoria", ["categoria"])
    .index("byVehiculo", ["vehiculo"]),

  // ======= DEPÓSITOS =======
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
    nombre: v.string(),
    ingreso_egreso: v.union(v.literal("ingreso"), v.literal("egreso")),
  }),

  tipos_comprobante: defineTable({
    nombre: v.string(),
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
    estado: v.string(),
    usuario: v.optional(v.string()),
  }).index("byEstado", ["estado"]),

  detalle_traspaso: defineTable({
    traspasoId: v.id("traspasos"),
    repuestoId: v.id("repuestos"),
    cantidad: v.number(),
  }).index("byTraspaso", ["traspasoId"]),

  // ======= PROVEEDORES / COMPRAS =======
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
    codigo: v.optional(v.string()),
  }),

  ordenes_compra: defineTable({
    numeroOrden: v.string(),
    proveedorId: v.id("proveedores"),
    fechaOrden: v.string(),
    fechaEsperada: v.optional(v.string()),
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
    
    totalGeneral: v.number(),

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
    unidadMedida: v.string(),
    cantidadPedida: v.number(),
    cantidadRecibida: v.number(),
    cantidadCancelada: v.number(),
    precioUnitario: v.number(),
    descuentoPorc: v.optional(v.number()),
    
    totalLinea: v.number(),
    fechaNecesidad: v.optional(v.string()),
    depositoId: v.id("depositos"),
    centroCosto: v.optional(v.string()),
    estadoLinea: v.union(
      v.literal("ABIERTA"),
      v.literal("CERRADA"),
      v.literal("CANCELADA")
    ),
  }).index("por_oc", ["ocId"]),

  facturas_prov: defineTable({
  ocId: v.optional(v.id("ordenes_compra")),
  proveedorId: v.id("proveedores"),
  proveedorNombre: v.string(),
  numeroProveedor: v.string(),
  puntoVenta: v.optional(v.number()),
  tipo: v.optional(v.string()),
  fechaEmision: v.string(),
  fechaVencimiento: v.optional(v.string()),
  moneda: v.union(v.literal("ARS"), v.literal("USD")),
  tipoCambio: v.optional(v.number()),
  neto: v.number(),
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

facturas_prov_items: defineTable({
  facturaId: v.id("facturas_prov"),
  ocItemId: v.optional(v.id("detalle_ordenes_compra")),
  repuestoId: v.optional(v.id("repuestos")),
  descripcion: v.string(),
  cantidad: v.number(),
  precioUnitario: v.number(),
  descuentoPorc: v.optional(v.number()),
  subtotal: v.number(),
  totalLinea: v.number(),
}).index("byFactura", ["facturaId"]),

  pagos_prov: defineTable({
    facturaId: v.id("facturas_prov"),
    fechaPago: v.string(),
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

  // ======= COMPROBANTES DE PROVEEDOR (rama "facturas") =======
  comprobantes_prov: defineTable({
    proveedorId: v.id("proveedores"),
    proveedorCuit: v.string(), // nuevo campo
    tipoComprobanteId: v.id("tipos_comprobante"),
    letra: v.string(),
    sucursal: v.string(),
    numero: v.string(),
    fecha: v.string(),
    hora: v.string(),
    total: v.number(),
    saldo: v.number(),
    estado: v.union(
      v.literal("PENDIENTE"),
      v.literal("PARCIAL"),
      v.literal("PAGADO"),
      v.literal("ANULADO")
    ),
    creadoEn: v.number(),
    actualizadoEn: v.number(),
  })
    .index("byProveedor", ["proveedorId"])
    .index("byNumero", ["sucursal", "numero"]),

  detalle_comprobantes_prov: defineTable({
    comprobanteId: v.id("comprobantes_prov"),
    repuestoId: v.id("repuestos"),
    cantidad: v.number(),
    precioUnitario: v.number(),
    subtotal: v.number(),
  }).index("byComprobante", ["comprobanteId"]),

  pagos_comprobantes: defineTable({
    comprobanteId: v.id("comprobantes_prov"),
    fechaPago: v.string(), // ISO string
    medio: v.union(
      v.literal("TRANSFERENCIA"),
      v.literal("EFECTIVO"),
      v.literal("CHEQUE"),
      v.literal("TARJETA"),
      v.literal("OTRO")
    ),
    importe: v.number(),
    notas: v.optional(v.string()),
    creadoEn: v.number(),
  }).index("byComprobante", ["comprobanteId"]),

  // ======= CRM (rama mainv2) =======
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

  contratos: defineTable({
    clienteId: v.id("clientes"),
    titulo: v.string(),
    fechaInicio: v.string(),
    fechaFin: v.optional(v.string()),
    monto: v.number(),
    estado: v.string(),
    notas: v.optional(v.string()),
    creadoEn: v.number(),
    // compat: metadatos de archivo opcionales
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

  contratos_adjuntos: defineTable({
    contratoId: v.id("contratos"),
    archivoId: v.id("_storage"),
    nombre: v.optional(v.string()),
    tipo: v.optional(v.string()),
    tamanio: v.optional(v.number()),
    subidoEn: v.number(),
  }).index("por_contrato", ["contratoId"]),

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
  }).index("por_contrato", ["contratoId"]),

  notas_financieras: defineTable({
    clienteId: v.id("clientes"),
    contratoId: v.id("contratos"),
    tipo: v.union(v.literal("credito"), v.literal("debito")), // crédito = a favor del cliente
    monto: v.number(),
    motivo: v.string(), // texto libre
    generadoEn: v.number(), // timestamp
  })
    .index("por_cliente", ["clienteId"])
    .index("por_contrato", ["contratoId"]),


// ======= VENTAS (basado en distancias) =======
// ======= CLIENTES DE VENTAS =======
clientes_ventas: defineTable({
  razonSocial: v.string(),         // Nombre fiscal oficial
  alias: v.optional(v.string()),   // Alias o nombre comercial (ej: "Minera Los Andes")
  cuit: v.string(),                // CUIT único
  direccion: v.string(),
  provincia: v.optional(v.string()),
  ciudad: v.optional(v.string()),
  codigoPostal: v.optional(v.string()),
  telefono: v.optional(v.string()),
  email: v.optional(v.string()),
  estado: v.union(v.literal("ACTIVO"), v.literal("INACTIVO")),
  notas: v.optional(v.string()),
  creadoPor: v.optional(v.string()),  // ID o nombre del usuario que lo creó
  creadoEn: v.number(),
  actualizadoEn: v.number(),
})
  .index("by_cuit", ["cuit"])
  .index("by_razonSocial", ["razonSocial"])
  .index("by_estado", ["estado"]),


contratos_servicios: defineTable({
  clienteId: v.id("clientes_ventas"),
  clienteRazonSocial: v.optional(v.string()), // 🔹 duplicado del cliente
  clienteCuit: v.optional(v.string()),        // 🔹 duplicado del CUIT
  tipo: v.string(),
  tarifaBase: v.number(),
  fechaInicio: v.string(),
  fechaFin: v.optional(v.string()),
  estado: v.string(), // VIGENTE | FINALIZADO | PENDIENTE
  notas: v.optional(v.string()),
  creadoEn: v.number(),
  actualizadoEn: v.number(),
}).index("byCliente", ["clienteId"]),



facturas_ventas: defineTable({
  clienteId: v.id("clientes_ventas"),
  contratoId: v.optional(v.id("contratos_servicios")),
  numero: v.string(),
  tipoComprobante: v.union(v.literal("FACTURA_A"), v.literal("FACTURA_B"), v.literal("FACTURA_C")),
  fecha: v.string(),
  hora: v.string(), 
  items: v.array(
    v.object({
      viajeId: v.id("viajes"),
      descripcion: v.string(),   // Ej: "Mina X → Planta Y"
      cantidad: v.number(),      // normalmente 1 viaje
      precioUnitario: v.number(),
      subtotal: v.number(),
    })
  ),
  subtotal: v.number(),
  iva: v.number(),
  total: v.number(),
  estado: v.union(v.literal("EMITIDA"), v.literal("PAGADA"), v.literal("VENCIDA"), v.literal("PENDIENTE")),
  creadoEn: v.number(),
  actualizadoEn: v.number(),
})
  .index("by_cliente", ["clienteId"])
  .index("by_fecha", ["fecha"])
  .index("by_estado", ["estado"]),



choferes: defineTable({
  nombre: v.string(),        // solo el nombre propio
  apellido: v.string(),      // solo el apellido
  dni: v.string(),
  telefono: v.optional(v.string()),
  licencia: v.string(),
  estado: v.union(v.literal("ACTIVO"), v.literal("INACTIVO")),
  creadoEn: v.number(),
})
  .index("byEstado", ["estado"])
  .index("byNombre", ["nombre"])
  .index("byApellido", ["apellido"])
  .index("byDni", ["dni"]),


viajes: defineTable({
  clienteId: v.id("clientes_ventas"), // ✅ referencia corregida
  choferId: v.id("choferes"),
  vehiculoId: v.optional(v.id("vehiculos")),
  origen: v.string(),
  destino: v.string(),
  distanciaKm: v.number(),
  fecha: v.optional(v.string()), // opcional, si no se carga desde UI
  estado: v.union(
    v.literal("PENDIENTE"),
    v.literal("EN_CURSO"),
    v.literal("FINALIZADO"),
    v.literal("CANCELADO")
  ),
  notas: v.optional(v.string()),
  creadoEn: v.number(),
  actualizadoEn: v.optional(v.number()), // ✅ agregado
})
  .index("byCliente", ["clienteId"])
  .index("byChofer", ["choferId"])
  .index("byVehiculo", ["vehiculoId"])
  .index("byEstado", ["estado"])
  .index("byFecha", ["fecha"]),


  mantenimientos: defineTable({
  vehiculoId: v.id("vehiculos"),
  vehiculoNombre: v.optional(v.string()),
  tipo: v.string(),
  fecha: v.string(), // formato ISO
  costo: v.optional(v.number()),
  descripcion: v.optional(v.string()),
  estado: v.union(
    v.literal("PENDIENTE"),
    v.literal("EN_CURSO"),
    v.literal("FINALIZADO")
  ),
  creadoEn: v.number(),
  actualizadoEn: v.number(),
})
  .index("byVehiculo", ["vehiculoId"])
  .index("byEstado", ["estado"]),



marcas_vehiculos: defineTable({
  nombre: v.string(),
  slug: v.string(),
  pais: v.optional(v.string()),
  descripcion: v.optional(v.string()),
  creadoEn: v.number(),
  actualizadoEn: v.number(),
})
  .index("by_nombre", ["nombre"])
  .index("by_slug", ["slug"]),

});