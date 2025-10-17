"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Search, MoreVertical, Truck, Plus } from "lucide-react";

export default function ViajesPage() {
  const data = useQuery(api.viajes.listarConNombres) ?? [];
  const stats = useQuery(api.viajes.estadisticas);
  const [busqueda, setBusqueda] = useState("");

  return (
    <div className="min-h-screen bg-[#0d1b1e] p-8 text-[#e8f9f9]">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Viajes</h1>
          <p className="text-[#a8d8d3] text-sm">
            Registro y seguimiento de viajes realizados o en curso.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-[#7ca6a8]" size={20} />
            <input
              type="text"
              placeholder="Buscar viaje o cliente..."
              className="pl-10 pr-4 py-2 border border-[#23454e] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#36b6b0] bg-[#11292e] text-gray-200 w-64 shadow-sm placeholder:text-gray-400"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <Link
            href="/viajes/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2ca6a4] hover:bg-[#249390] text-white font-semibold shadow-sm"
          >
            <Plus size={18} /> Nuevo viaje
          </Link>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <KpiCard icon={Truck} color="#2ca6a4" label="Total" value={stats.total} />
          <KpiCard color="#36b6b0" label="Finalizados" value={stats.finalizados} />
          <KpiCard color="#e6b800" label="En curso" value={stats.enCurso} />
          <KpiCard color="#ff5c5c" label="Pendientes" value={stats.pendientes} />
        </div>
      )}

      {/* Tabla */}
      <div className="bg-[#11292e] rounded-2xl shadow-md border border-[#1e3c42] p-6">
        <h2 className="text-xl font-bold text-[#e8f8f8] mb-4">Listado de viajes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0e2529] text-[#9ed1cd] text-sm">
                <th className="p-3 font-medium">Cliente</th>
                <th className="p-3 font-medium">Chofer</th>
                <th className="p-3 font-medium">Origen</th>
                <th className="p-3 font-medium">Destino</th>
                <th className="p-3 font-medium">Distancia</th>
                <th className="p-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data
                .filter(
                  (v: any) =>
                    v.clienteNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                    v.choferNombre?.toLowerCase().includes(busqueda.toLowerCase())
                )
                .map((v: any) => (
                  <tr key={v._id} className="border-t border-[#1e3c42] hover:bg-[#15393f] transition">
                    <td className="p-3 text-[#d6f4f4]">{v.clienteNombre}</td>
                    <td className="p-3 text-[#d6f4f4]">{v.choferNombre}</td>
                    <td className="p-3 text-[#d6f4f4]">{v.origen}</td>
                    <td className="p-3 text-[#d6f4f4]">{v.destino}</td>
                    <td className="p-3 text-[#d6f4f4]">{v.distanciaKm} km</td>
                    <td className="p-3">
                      <EstadoPill estado={v.estado} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, color, label, value }: any) {
  return (
    <div className="bg-[#11292e] rounded-xl border border-[#1e3c42] shadow-md p-6 relative">
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-xl" style={{ backgroundColor: `${color}22` }}>
          {Icon ? <Icon style={{ color }} size={28} /> : <Truck style={{ color }} size={28} />}
        </div>
        <div>
          <p className="text-[#93c6c1] text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-[#e8f8f8]">{value}</p>
        </div>
      </div>
      <MoreVertical className="absolute right-4 top-4 text-[#7bbdb7]" size={18} />
    </div>
  );
}

function EstadoPill({ estado }: { estado: string }) {
  const map: any = {
    PENDIENTE: "bg-yellow-800/30 text-yellow-300",
    EN_CURSO: "bg-blue-800/30 text-blue-300",
    FINALIZADO: "bg-green-800/30 text-green-300",
    CANCELADO: "bg-red-800/30 text-red-300",
  };
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${map[estado] ?? ""}`}>
      {estado}
    </span>
  );
}
