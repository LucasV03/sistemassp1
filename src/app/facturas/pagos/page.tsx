"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";

export default function PagosPage() {
  const [q, setQ] = useState("");
  const pagos =
    (useQuery(api.pagos_comprobantes.listar, {}) ?? []) as (Doc<"pagos_comprobantes"> & {
      proveedorNombre?: string;
      facturaNumero?: string;
    })[];

  if (!pagos) return <div className="p-6 text-neutral-300">Cargando…</div>;

  return (
    <div className="min-h-screen bg-[#0d1b1e] text-[#e6f6f7] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Historial de Pagos</h1>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 text-[#7ca6a8]" size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por proveedor…"
            className="pl-9 pr-3 py-2 rounded-lg border border-[#1e3c42] bg-[#11292e] text-gray-200 placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#1e3c42] overflow-hidden bg-[#11292e]">
        <table className="w-full text-sm">
          <thead className="bg-[#0e2529] text-[#9ed1cd]">
            <tr>
              <th className="p-2 text-left">Proveedor</th>
              <th className="p-2 text-left">Facturas</th>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Medio</th>
              <th className="p-2 text-left">Referencia</th>
              <th className="p-2 text-right">Importe</th>
              <th className="p-2 text-left">Notas</th>
            </tr>
          </thead>
          <tbody>
            {pagos
              .filter((p) =>
                q.trim()
                  ? (p.proveedorNombre ?? "").toLowerCase().includes(q.toLowerCase())
                  : true
              )
              .map((p) => (
                <tr key={p._id} className="border-t border-[#1e3c42] hover:bg-[#15393f] transition">
                  <td className="p-2 text-[#d6f4f4]">{p.proveedorNombre}</td>
                  <td className="p-2 text-[#d6f4f4]">{(p as any).facturasNumeros ?? p.facturaNumero ?? "—"}</td>
                  <td className="p-2 text-[#d6f4f4]">{new Date(p.fechaPago).toLocaleString("es-AR")}</td>
                  <td className="p-2 text-[#d6f4f4]">{p.medio}</td>
                  <td className="p-2 text-[#d6f4f4]">{p.referencia || "—"}</td>
                  <td className="p-2 text-right text-[#d6f4f4]">
                  {p.importe.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  })}
                  </td>
                  <td className="p-2 text-[#d6f4f4]">{p.notas ?? "—"}</td>
                </tr>
              ))}
            {pagos.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-400">
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
