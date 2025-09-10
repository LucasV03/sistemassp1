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
    direccion: v.string(),
    activo: v.boolean(), 
    reputacion: v.optional(v.number()), 
    productos_ofrecidos: v.array(v.id("repuestos")), 
    notas: v.optional(v.string()),
  }),

});
