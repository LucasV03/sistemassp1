"use client";

import { Search, Car, Wrench, AlertTriangle, Settings, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

export default function VehiculosPage() {
  const [busqueda, setBusqueda] = useState("");
  const data = useQuery(api.vehiculos.buscar, { q: busqueda })?.items ?? [];

  const stats = useQuery(api.vehiculos.estadisticas, {}) ?? {
    total: 0,
    operativos: 0,
    mantenimiento: 0,
    fuera: 0,
  };

  return (
    <div className="min-h-screen bg-[#0d1b1e] text-[#e8f9f9] p-8 space-y-8 transition-colors duration-300">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Vehículos</h1>
          <p className="text-[#a8d8d3] text-sm">
            Administración de flota y estado operativo de los vehículos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-[#5ba7a1]" size={18} />
            <input
              type="text"
              placeholder="Buscar vehículo..."
              className="pl-9 pr-4 py-2 rounded-lg border border-[#2f6368] bg-[#24474d] text-[#e8f9f9] placeholder-gray-400 w-64 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <Link
            href="/vehiculos/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2ca6a4] hover:bg-[#249390] text-white font-semibold shadow-sm"
          >
            <PlusCircle size={18} />
            Nuevo vehículo
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard icon={Car} color="#36b6b0" label="Total" value={stats.total} />
        <KpiCard icon={Wrench} color="#2ca6a4" label="Operativos" value={stats.operativos} />
        <KpiCard icon={Settings} color="#e6b800" label="Mantenimiento" value={stats.mantenimiento} />
        <KpiCard icon={AlertTriangle} color="#ff5c5c" label="Fuera de servicio" value={stats.fuera} />
      </div>

      {/* TABLA */}
      <div className="bg-[#11292e] rounded-2xl shadow-md border border-[#1e3c42] p-6 transition-all">
        <h2 className="text-xl font-bold text-[#e8f8f8] mb-4">Listado de Vehículos</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0e2529] text-[#9ed1cd] text-sm">
                <th className="p-3 font-medium">Nombre</th>
                <th className="p-3 font-medium">Marca</th>
                <th className="p-3 font-medium">Patente</th>
                <th className="p-3 font-medium">Tipo</th>
                <th className="p-3 font-medium">Capacidad</th>
                <th className="p-3 font-medium">Estado</th>
                <th className="p-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {data.length > 0 ? (
                data
                  .filter((v: any) =>
                    [v.nombre, v.tipo, v.patente].some((x) =>
                      x?.toLowerCase().includes(busqueda.toLowerCase())
                    )
                  )
                  .map((v: any) => (
                    <tr key={v._id} className="border-t border-[#1e3c42] hover:bg-[#15393f] transition">
                      <td className="p-3 text-[#d6f4f4] font-medium">{v.nombre}</td>
                      <td className="p-3 text-[#d6f4f4]">{v.marcaNombre || "—"}</td>
                      <td className="p-3 text-[#d6f4f4]">{v.patente || "—"}</td>
                      <td className="p-3 text-[#d6f4f4]">{v.tipoVehiculoNombre || "—"}</td>

                      <td className="p-3 text-[#d6f4f4]">{v.capacidad ? `${v.capacidad} personas` : "—"}</td>
                      <td className="p-3">
                        <Estado estado={v.estado} />
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 justify-end">
                          <Link
                            href={`/vehiculos/${String(v._id)}/`}
                            className="px-3 py-1.5 rounded-lg bg-[#2ca6a4] hover:bg-[#249390] text-white text-xs font-medium transition"
                          >
                            Ver
                          </Link>
                          <Link
                            href={`/vehiculos/${String(v._id)}/editar/`}
                            className="px-3 py-1.5 rounded-lg bg-[#2ca6a4] hover:bg-[#249390] text-white text-xs font-medium transition"
                          >
                            Editar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-400 text-sm">
                    No hay vehículos registrados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- COMPONENTES ---------- */
function KpiCard({ icon: Icon, color, label, value }: any) {
  return (
    <div className="bg-[#11292e] rounded-xl border border-[#1e3c42] shadow-md p-6 relative hover:shadow-lg transition">
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-xl" style={{ backgroundColor: `${color}22` }}>
          <Icon style={{ color }} size={28} />
        </div>
        <div>
          <p className="text-sm text-[#93c6c1] mb-1">{label}</p>
          <p className="text-3xl font-bold text-[#e8f8f8]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Estado({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    OPERATIVO: "bg-green-800/30 text-green-300",
    MANTENIMIENTO: "bg-yellow-800/30 text-yellow-300",
    FUERA_SERVICIO: "bg-red-800/30 text-red-300",
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full ${
        map[estado] ?? "bg-gray-700 text-gray-300"
      }`}
    >
      {estado}
    </span>
  );
}
