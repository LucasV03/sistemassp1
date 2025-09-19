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
import type * as comprobantes_prov from "../comprobantes_prov.js";
import type * as depositos from "../depositos.js";
import type * as detalle_traspaso from "../detalle_traspaso.js";
import type * as facturas_prov from "../facturas_prov.js";
import type * as marcas from "../marcas.js";
import type * as modelos from "../modelos.js";
import type * as movimientos from "../movimientos.js";
import type * as ordenesCompra from "../ordenesCompra.js";
import type * as proveedores from "../proveedores.js";
import type * as repuestos from "../repuestos.js";
import type * as repuestos_por_deposito from "../repuestos_por_deposito.js";
import type * as tipos_comprobante from "../tipos_comprobante.js";
import type * as tipos_movimiento from "../tipos_movimiento.js";
import type * as traspasos from "../traspasos.js";
import type * as vehiculos from "../vehiculos.js";

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
  comprobantes_prov: typeof comprobantes_prov;
  depositos: typeof depositos;
  detalle_traspaso: typeof detalle_traspaso;
  facturas_prov: typeof facturas_prov;
  marcas: typeof marcas;
  modelos: typeof modelos;
  movimientos: typeof movimientos;
  ordenesCompra: typeof ordenesCompra;
  proveedores: typeof proveedores;
  repuestos: typeof repuestos;
  repuestos_por_deposito: typeof repuestos_por_deposito;
  tipos_comprobante: typeof tipos_comprobante;
  tipos_movimiento: typeof tipos_movimiento;
  traspasos: typeof traspasos;
  vehiculos: typeof vehiculos;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
