"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Search,
  MoreVertical,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  Pencil,
} from "lucide-react";

export default function ContratosPage() {
  const contratos = useQuery(api.contratos_servicios.listarConCliente) ?? [];
  const stats = useQuery(api.contratos_servicios.estadisticas);
  const [busqueda, setBusqueda] = useState("");

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(n);

  const formatDate = (date: string) => {
    if (!date) return "—";
    const d = new Date(date);
    return d.toLocaleDateString("es-AR");
  };

  return (
    <div className="min-h-screen bg-[#1b3a3f] p-8 text-[#e8f9f9] space-y-8 transition-colors duration-300">
      {/* ---------- HEADER ---------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contratos de Servicios</h1>
          <p className="text-[#a8d8d3] text-sm">
            Administración de contratos activos y finalizados con clientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-[#5ba7a1]"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar contrato o cliente..."
              className="pl-9 pr-4 py-2 rounded-lg border border-[#2f6368] bg-[#24474d] text-[#e8f9f9] placeholder-gray-400 w-64 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <Link
            href="/contratos-servicios/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2ca6a4] hover:bg-[#249390] text-white font-semibold shadow-sm"
          >
            <Plus size={18} />
            Nuevo contrato
          </Link>
        </div>
      </div>

      {/* ---------- KPIs ---------- */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiCard
            icon={FileText}
            color="#2ca6a4"
            label="Vigentes"
            value={stats.vigentes}
            subtitle="Contratos activos"
            trend="up"
          />
          <KpiCard
            icon={FileText}
            color="#e6b800"
            label="Finalizados"
            value={stats.finalizados}
            subtitle="Cerrados correctamente"
            trend="down"
          />
          <KpiCard
            icon={FileText}
            color="#36b6b0"
            label="Total"
            value={stats.total}
            subtitle="Registrados en el sistema"
            trend="up"
          />
        </div>
      )}

      {/* ---------- TABLA ---------- */}
      <div className="bg-[#24474d] rounded-xl shadow-md border border-[#2f6368] p-6">
        <h2 className="text-xl font-semibold mb-4">Listado de Contratos</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[#b7e2de] border-b border-[#2f6368] text-sm">
                <th className="p-3 font-medium">Cliente</th>
                <th className="p-3 font-medium">Tipo</th>
                <th className="p-3 font-medium">Tarifa Base</th>
                <th className="p-3 font-medium">Estado</th>
                <th className="p-3 font-medium">Inicio</th>
                <th className="p-3 font-medium">Fin</th>
                <th className="p-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {contratos.length > 0 ? (
                contratos
                  .filter(
                    (c: any) =>
                      c.clienteNombre
                        ?.toLowerCase()
                        .includes(busqueda.toLowerCase()) ||
                      c.tipo?.toLowerCase().includes(busqueda.toLowerCase())
                  )
                  .map((c: any) => (
                    <tr
                      key={c._id}
                      className="border-b border-[#2f6368] hover:bg-[#2b5a60] transition"
                    >
                      <td className="p-3">{c.clienteNombre}</td>
                      <td className="p-3">{c.tipo}</td>
                      <td className="p-3">{fmt(c.tarifaBase)}</td>
                      <td className="p-3">
                        <EstadoPill estado={c.estado} />
                      </td>
                      <td className="p-3">{formatDate(c.fechaInicio)}</td>
                      <td className="p-3">{formatDate(c.fechaFin)}</td>
                      <td className="p-3 text-center flex justify-center gap-2">
                        <Link
                          href={`/contratos-servicios/${c._id}`}
                          className="flex items-center gap-1 px-3 py-1 rounded bg-[#36b6b0] text-white text-xs font-semibold hover:bg-[#2ca6a4]"
                        >
                          <Eye size={14} /> Ver
                        </Link>
                        <Link
                          href={`/contratos-servicios/${c._id}?edit=true`}
                          className="flex items-center gap-1 px-3 py-1 rounded bg-[#b7d9d7] text-[#1b3a3f] text-xs font-semibold hover:bg-[#a0c8c5]"
                        >
                          <Pencil size={14} /> Editar
                        </Link>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-6 text-[#b7e2de] text-sm"
                  >
                    No hay contratos registrados aún.
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

/* ---------- COMPONENTES AUXILIARES ---------- */

function KpiCard({ icon: Icon, color, label, value, subtitle, trend }: any) {
  const TrendIcon =
    trend === "up" ? (
      <ArrowUpRight className="text-green-400" size={18} />
    ) : (
      <ArrowDownRight className="text-red-400" size={18} />
    );

  return (
    <div className="bg-[#24474d] rounded-xl border border-[#2f6368] shadow-md p-6 relative hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: `${color}22` }}
          >
            {Icon ? <Icon style={{ color }} size={28} /> : null}
          </div>
          <div>
            <p className="text-sm text-[#a8d8d3] mb-1">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        </div>
        {TrendIcon}
      </div>
      {subtitle && <p className="mt-2 text-sm text-[#a8d8d3]">{subtitle}</p>}
      <MoreVertical
        className="absolute right-4 top-4 text-[#7bbdb7] cursor-pointer"
        size={18}
      />
    </div>
  );
}

function EstadoPill({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    VIGENTE: "bg-green-800/30 text-green-300",
    FINALIZADO: "bg-red-800/30 text-red-300",
    PENDIENTE: "bg-yellow-800/30 text-yellow-300",
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
