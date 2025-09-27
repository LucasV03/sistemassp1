// src/app/(panel)/ordenes-compra/page.tsx
'use client';
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

// 🔑 Formato moneda argentino
const moneyFmt = (moneda: string) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda || "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function OCList() {
  const list = useQuery(api.ordenesCompra.listarConNombres, {}) ?? [];
  const cambiarEstado = useMutation(api.ordenesCompra.cambiarEstado);

  return (
    <div className="p-6 space-y-4 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Órdenes de compra</h1>
        <Link
          href="/ordenes-compra/nueva"
          className="px-4 py-2 rounded bg-violet-600 text-white"
        >
          Nueva Orden de Compra
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
              <tr
                key={po._id}
                className="border-t border-neutral-800 hover:bg-neutral-900/40"
              >
                <td className="p-3">{po.numeroOrden}</td>
                <td className="p-3">{po.proveedorNombre}</td>
                <td className="p-3">{po.depositoNombre}</td>
                <td className="p-3">
                  {new Date(po.fechaOrden).toLocaleDateString("es-AR")}
                </td>
                <td className="p-3">{po.estado}</td>
                <td className="p-3 text-right">
                  {moneyFmt(po.moneda).format(po.totalGeneral)}
                </td>
                <td className="p-3">
                  <div className="flex gap-2 justify-end">
                    <Link
                      className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
                      href={`/ordenes-compra/${po._id}`}
                    >
                      Ver
                    </Link>
                    {(po.estado === "BORRADOR" ||
                      po.estado === "PENDIENTE_APROBACION") && (
                      <button
                        onClick={() =>
                          cambiarEstado({ id: po._id, estado: "APROBADA" })
                        }
                        className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white"
                      >
                        Aprobar
                      </button>
                    )}
                    {po.estado === "APROBADA" && (
                      <button
                        onClick={() =>
                          cambiarEstado({ id: po._id, estado: "ENVIADA" })
                        }
                        className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white"
                      >
                        Enviar
                      </button>
                    )}
                  </div>
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
