"use client";

import {
  Search,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Pencil,
} from "lucide-react";
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
    <div className="min-h-screen bg-[#0d1b1e] text-white p-6 transition-colors duration-300">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold text-white">Mantenimientos</h1>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar mantenimiento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 pr-4 py-2 border border-[#23454e] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#36b6b0] bg-[#11292e] text-white placeholder-gray-400 w-64 shadow-sm"
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

      {/* TABLA */}
      <div className="bg-[#11292e] rounded-xl shadow-md border border-[#1e3c42] p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Listado de Mantenimientos
        </h2>

        {data.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0e2529] text-[#93c6c1]">
                <th className="p-3">Vehículo</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Costo</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m: any) => (
                <tr
                  key={m._id}
                  className="border-t border-[#1e3c42] hover:bg-[#15393f] transition text-white"
                >
                  <td className="p-3 font-medium">{m.vehiculoNombre || "—"}</td>
                  <td className="p-3">{m.tipo || "—"}</td>
                  <td className="p-3">
                    {new Date(m.fecha).toLocaleDateString("es-AR")}
                  </td>
                  <td className="p-3">
                    {m.costo ? `$ ${m.costo.toLocaleString("es-AR")}` : "—"}
                  </td>
                  <td className="p-3">
                    <Estado estado={m.estado} />
                  </td>
                  <td className="p-3 text-center">
                    <Link
                      href={`/mantenimientos/${m._id}/editar`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-medium text-sm transition"
                    >
                      <Pencil size={16} />
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-[#93c6c1] text-center py-4">
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
    <div className="bg-[#11292e] rounded-xl shadow-md p-6 border border-[#1e3c42]">
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-xl" style={{ backgroundColor: `${color}22` }}>
          <Icon style={{ color }} size={28} />
        </div>
        <div>
          <p className="text-[#93c6c1] text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Estado({ estado }: { estado: string }) {
  const map: any = {
    PENDIENTE:
      "bg-yellow-800/30 text-yellow-300 border border-yellow-700",
    EN_CURSO:
      "bg-blue-800/30 text-blue-300 border border-blue-700",
    FINALIZADO:
      "bg-green-800/30 text-green-300 border border-green-700",
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full ${map[estado] ?? ""}`}
    >
      {estado || "—"}
    </span>
  );
}
