'use client';
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function OCList() {
  const list = useQuery(api.ordenesCompra.listarConNombres, {}) ?? [];

  return (
    <div className="p-6 space-y-4 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Órdenes de compra</h1>
        <Link href="/ordenes-compra/nueva" className="px-4 py-2 rounded bg-violet-600 text-white">
          Nueva OC
        </Link>
      </div>

      <div className="rounded border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900">
            <tr>
              <th className="p-3 text-left">N°</th>
              <th className="p-3 text-left">Proveedor</th>
              <th className="p-3 text-left">Depósito</th>
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map((po: any) => (
              <tr key={po._id} className="border-t border-neutral-800 hover:bg-neutral-900/40">
                <td className="p-3">{po.numeroOrden}</td>
                <td className="p-3">{po.proveedorNombre}</td>
                <td className="p-3">{po.depositoNombre}</td>
                <td className="p-3">{new Date(po.fechaOrden).toLocaleDateString()}</td>
                <td className="p-3">{po.estado}</td>
                <td className="p-3 text-right">
                  {po.totalGeneral.toFixed(2)} {po.moneda}
                </td>
                <td className="p-3 text-right">
                  <Link
                    className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
                    href={`/ordenes-compra/${po._id}`}
                  >
                    Ver orden
                  </Link>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-neutral-400">
                  No hay órdenes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
