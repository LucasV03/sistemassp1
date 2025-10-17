"use client";

import { Search, Wrench, Clock, CheckCircle2, AlertTriangle, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

export default function MantenimientosPage() {
  const [busqueda, setBusqueda] = useState("");
  const data = useQuery(api.mantenimientos.listar, { q: busqueda }) ?? [];

  const stats = useQuery(api.mantenimientos.estadisticas, {}) ?? {
    total: 0,
    pendientes: 0,
    enCurso: 0,
    finalizados: 0,
  };

  return (
    <div className="min-h-screen bg-[#f8fafa] dark:bg-[#0d1b1e] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#1a3b47] dark:text-[#e6f6f7]">
          Mantenimientos
        </h1>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar mantenimiento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 pr-4 py-2 border border-[#d2e6e9] dark:border-[#23454e] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#36b6b0] bg-white dark:bg-[#11292e] text-gray-700 dark:text-gray-200 w-64 shadow-sm"
            />
            <Search className="absolute left-3 top-2.5 text-[#7ca6a8]" size={20} />
          </div>

          <Link
            href="/mantenimientos/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-semibold shadow-sm transition"
          >
            <PlusCircle size={18} />
            Nuevo Mantenimiento
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <KpiCard label="Total" value={stats.total} color="#36b6b0" icon={Wrench} />
        <KpiCard label="Pendientes" value={stats.pendientes} color="#f59e0b" icon={AlertTriangle} />
        <KpiCard label="En Curso" value={stats.enCurso} color="#3b82f6" icon={Clock} />
        <KpiCard label="Finalizados" value={stats.finalizados} color="#10b981" icon={CheckCircle2} />
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-[#11292e] rounded-xl shadow-md border border-[#e1efef] dark:border-[#1e3c42] p-6">
        <h2 className="text-xl font-bold text-[#1a3b47] dark:text-[#e8f8f8] mb-4">
          Listado de Mantenimientos
        </h2>

        {data.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f2fafa] dark:bg-[#0e2529] text-[#4b6a6e] dark:text-[#9ed1cd]">
                <th className="p-3">Vehículo</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Costo</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m: any) => (
                <tr
                  key={m._id}
                  className="border-t border-[#d8ecec] dark:border-[#1e3c42] hover:bg-[#eefafa] dark:hover:bg-[#15393f] transition"
                >
                  <td className="p-3 text-[#1a3b47] dark:text-[#d6f4f4] font-medium">
                    {m.vehiculoNombre || "—"}
                  </td>
                  <td className="p-3">{m.tipo || "—"}</td>
                  <td className="p-3">{new Date(m.fecha).toLocaleDateString("es-AR")}</td>
                  <td className="p-3">
                    {m.costo ? `$ ${m.costo.toLocaleString("es-AR")}` : "—"}
                  </td>
                  <td className="p-3">
                    <Estado estado={m.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-[#688b8f] dark:text-[#93c6c1] text-center py-4">
            No se encontraron mantenimientos registrados.
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- COMPONENTES ---------- */
function KpiCard({ label, value, color, icon: Icon }: any) {
  return (
    <div className="bg-white dark:bg-[#11292e] rounded-xl shadow-md p-6 border border-[#e1efef] dark:border-[#1e3c42]">
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-xl" style={{ backgroundColor: `${color}22` }}>
          <Icon style={{ color }} size={28} />
        </div>
        <div>
          <p className="text-[#688b8f] dark:text-[#93c6c1] text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-[#1a3b47] dark:text-[#e8f8f8]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Estado({ estado }: { estado: string }) {
  const map: any = {
    PENDIENTE:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300",
    EN_CURSO:
      "bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300",
    FINALIZADO:
      "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300",
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full ${map[estado] ?? ""}`}
    >
      {estado || "—"}
    </span>
  );
}
