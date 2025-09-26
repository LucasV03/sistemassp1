"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";

export default function PagosPage() {
  const pagos =
    (useQuery(api.pagos_comprobantes.listar, {}) ?? []) as (Doc<"pagos_comprobantes"> & {
      proveedorNombre?: string;
      facturaNumero?: string;
    })[];

  if (!pagos) return <div className="p-6 text-neutral-300">Cargando…</div>;

  return (
    <div className="p-6 space-y-6 text-white">
      <h1 className="text-2xl font-bold">Historial de Pagos</h1>

      <div className="rounded border border-neutral-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="p-2 text-left">Proveedor</th>
              <th className="p-2 text-left">Factura</th>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Medio</th>
              <th className="p-2 text-right">Importe</th>
              <th className="p-2 text-left">Notas</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((p) => (
              <tr key={p._id} className="border-t border-neutral-800">
                <td className="p-2">{p.proveedorNombre}</td>
                <td className="p-2">{p.facturaNumero}</td>
                <td className="p-2">{new Date(p.fechaPago).toLocaleString("es-AR")}</td>
                <td className="p-2">{p.medio}</td>
                <td className="p-2 text-right">
                  {p.importe.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  })}
                </td>
                <td className="p-2">{p.notas ?? "—"}</td>
              </tr>
            ))}
            {pagos.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-neutral-500">
                  No hay pagos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
