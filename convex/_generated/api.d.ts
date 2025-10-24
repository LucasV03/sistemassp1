/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as _lib from "../_lib.js";
import type * as categorias from "../categorias.js";
import type * as choferes from "../choferes.js";
import type * as clientes from "../clientes.js";
import type * as clientes_ventas from "../clientes_ventas.js";
import type * as combos_pago from "../combos_pago.js";
import type * as comprobantes_prov from "../comprobantes_prov.js";
import type * as contratos from "../contratos.js";
import type * as contratos_servicios from "../contratos_servicios.js";
import type * as depositos from "../depositos.js";
import type * as detalle_traspaso from "../detalle_traspaso.js";
import type * as facturas_prov from "../facturas_prov.js";
import type * as facturas_ventas from "../facturas_ventas.js";
import type * as interacciones from "../interacciones.js";
import type * as mantenimientos from "../mantenimientos.js";
import type * as marcas from "../marcas.js";
import type * as marcas_vehiculos from "../marcas_vehiculos.js";
import type * as modelos from "../modelos.js";
import type * as movimientos from "../movimientos.js";
import type * as notas from "../notas.js";
import type * as notasFinancieras from "../notasFinancieras.js";
import type * as ordenesCompra from "../ordenesCompra.js";
import type * as pagos_comprobantes from "../pagos_comprobantes.js";
import type * as proveedores from "../proveedores.js";
import type * as repuestos from "../repuestos.js";
import type * as repuestos_por_deposito from "../repuestos_por_deposito.js";
import type * as scripts_limpiarVehiculosAntiguos from "../scripts/limpiarVehiculosAntiguos.js";
import type * as scripts_migrarVehiculos from "../scripts/migrarVehiculos.js";
import type * as seed from "../seed.js";
import type * as tarifas_vehiculos from "../tarifas_vehiculos.js";
import type * as tipos_comprobante from "../tipos_comprobante.js";
import type * as tipos_movimiento from "../tipos_movimiento.js";
import type * as tipos_vehiculo from "../tipos_vehiculo.js";
import type * as traspasos from "../traspasos.js";
import type * as vehiculos from "../vehiculos.js";
import type * as viajes from "../viajes.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  _lib: typeof _lib;
  categorias: typeof categorias;
  choferes: typeof choferes;
  clientes: typeof clientes;
  clientes_ventas: typeof clientes_ventas;
  combos_pago: typeof combos_pago;
  comprobantes_prov: typeof comprobantes_prov;
  contratos: typeof contratos;
  contratos_servicios: typeof contratos_servicios;
  depositos: typeof depositos;
  detalle_traspaso: typeof detalle_traspaso;
  facturas_prov: typeof facturas_prov;
  facturas_ventas: typeof facturas_ventas;
  interacciones: typeof interacciones;
  mantenimientos: typeof mantenimientos;
  marcas: typeof marcas;
  marcas_vehiculos: typeof marcas_vehiculos;
  modelos: typeof modelos;
  movimientos: typeof movimientos;
  notas: typeof notas;
  notasFinancieras: typeof notasFinancieras;
  ordenesCompra: typeof ordenesCompra;
  pagos_comprobantes: typeof pagos_comprobantes;
  proveedores: typeof proveedores;
  repuestos: typeof repuestos;
  repuestos_por_deposito: typeof repuestos_por_deposito;
  "scripts/limpiarVehiculosAntiguos": typeof scripts_limpiarVehiculosAntiguos;
  "scripts/migrarVehiculos": typeof scripts_migrarVehiculos;
  seed: typeof seed;
  tarifas_vehiculos: typeof tarifas_vehiculos;
  tipos_comprobante: typeof tipos_comprobante;
  tipos_movimiento: typeof tipos_movimiento;
  tipos_vehiculo: typeof tipos_vehiculo;
  traspasos: typeof traspasos;
  vehiculos: typeof vehiculos;
  viajes: typeof viajes;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
