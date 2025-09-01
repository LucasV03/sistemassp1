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
import type * as depositos from "../depositos.js";
import type * as movimientos from "../movimientos.js";
import type * as repuestos from "../repuestos.js";
import type * as repuestos_por_deposito from "../repuestos_por_deposito.js";
import type * as tipos_comprobantes from "../tipos_comprobantes.js";
import type * as tipos_movimiento from "../tipos_movimiento.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  depositos: typeof depositos;
  movimientos: typeof movimientos;
  repuestos: typeof repuestos;
  repuestos_por_deposito: typeof repuestos_por_deposito;
  tipos_comprobantes: typeof tipos_comprobantes;
  tipos_movimiento: typeof tipos_movimiento;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
