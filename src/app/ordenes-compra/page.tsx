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
    // Fondo principal: Usamos el color oscuro `#0b1618`
    <div className="min-h-screen bg-[#0b1618] text-gray-100 p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Órdenes de compra</h1>
        {/* Botón Nueva OC - Mantenemos el color de acento teal */}
        <Link
          href="/ordenes-compra/nueva"
          className="px-4 py-2 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-semibold shadow-md transition"
        >
          Nueva Orden de Compra
        </Link>
      </div>

      {/* Contenedor de la tabla - Usamos el color de caja/fondo secundario: `#11292e` */}
      <div className="bg-[#11292e] border border-[#1e3c42] rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-sm">
          {/* Encabezado de la tabla */}
          <thead className="bg-[#1e3c42] text-gray-300">
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
                // Fila y hover ajustados
                className="border-t border-[#1e3c42] hover:bg-[#1a3035] transition"
              >
                <td className="p-3 text-white font-medium">{po.numeroOrden}</td>
                <td className="p-3">{po.proveedorNombre}</td>
                <td className="p-3">{po.depositoNombre}</td>
                <td className="p-3 text-gray-400">
                  {new Date(po.fechaOrden).toLocaleDateString("es-AR")}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    po.estado === "APROBADA" 
                    ? 'bg-green-600/20 text-green-400' 
                    : po.estado === "BORRADOR" 
                      ? 'bg-gray-600/20 text-gray-400'
                      : 'bg-yellow-600/20 text-yellow-400'
                  }`}>
                    {po.estado}
                  </span>
                </td>
                <td className="p-3 text-right font-semibold text-[#36b6b0]">
                  {moneyFmt(po.moneda).format(po.totalGeneral)}
                </td>
                <td className="p-3">
                  <div className="flex gap-2 justify-end">
                    {/* Botón Ver */}
                    <Link
                      className="px-3 py-1.5 rounded-lg bg-[#1e3c42] hover:bg-[#2b5a60] text-gray-300 text-xs font-medium transition"
                      href={`/ordenes-compra/${po._id}`}
                    >
                      Ver
                    </Link>
                    
                    {/* Botón Aprobar */}
                    {(po.estado === "BORRADOR" ||
                      po.estado === "PENDIENTE_APROBACION") && (
                      <button
                        onClick={() =>
                          cambiarEstado({ id: po._id, estado: "APROBADA" })
                        }
                        className="px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-white text-xs font-medium transition"
                      >
                        Aprobar
                      </button>
                    )}
                    
                    {/* Botón Enviar */}
                    {po.estado === "APROBADA" && (
                      <button
                        onClick={() =>
                          cambiarEstado({ id: po._id, estado: "ENVIADA" })
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white text-xs font-medium transition"
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
                <td colSpan={7} className="p-4 text-center text-gray-400">
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