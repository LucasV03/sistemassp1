'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';

export default function OCList() {
  // Usa el listar del módulo ordenesCompra (el archivo convex/ordenesCompra.ts)
  const list = useQuery(api.ordenesCompra.listar, {});

  return (
    <div className="p-6 space-y-4 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Órdenes de compra</h1>
        <Link
          href="/ordenes-compra/nueva"
          className="px-4 py-2 rounded bg-violet-600 hover:bg-violet-500 text-white transition"
        >
          Nueva OC
        </Link>
      </div>

      <div className="rounded border border-neutral-800 overflow-hidden bg-[#0c0c0c]">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-100">
            <tr>
              <th className="p-3 text-left">N°</th>
              <th className="p-3 text-left">Proveedor</th>
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="text-neutral-200">
            {(list ?? []).map((oc: Doc<'ordenes_compra'>) => (
              <tr
                key={oc._id}
                className="border-t border-neutral-800 hover:bg-neutral-900/50"
              >
                <td className="p-3">
                  <Link
                    className="text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline"
                    href={`/ordenes-compra/${oc._id}`}
                  >
                    {oc.numeroOrden}
                  </Link>
                </td>
                {/* Por ahora mostramos el ID del proveedor (si querés, luego resolvemos el nombre) */}
                <td className="p-3">{String(oc.proveedorId)}</td>
                <td className="p-3">
                  {new Date(oc.fechaOrden).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-100">
                    {oc.estado}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {oc.totalGeneral.toFixed(2)} {oc.moneda}
                </td>
              </tr>
            ))}
            {(list ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-neutral-400">
                  No hay órdenes aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
