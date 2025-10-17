"use client";
import React from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Search,
  MoreVertical,
  DollarSign,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function VentasPage() {
  const facturas = useQuery(api.facturas_ventas.listarConCliente) ?? [];
  const stats = useQuery(api.facturas_ventas.estadisticas);

  // 🔹 Formato moneda ARS
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(n);

  return (
    <div className="min-h-screen bg-[#f8fafa] dark:bg-[#0d1b1e] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#1a3b47] dark:text-[#e6f6f7]">
          Ventas
        </h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar facturas..."
            className="pl-10 pr-4 py-2 border border-[#d2e6e9] dark:border-[#23454e] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#36b6b0] bg-white dark:bg-[#11292e] text-gray-700 dark:text-gray-200 w-64 shadow-sm"
          />
          <Search
            className="absolute left-3 top-2.5 text-[#7ca6a8] dark:text-[#5ba7a1]"
            size={20}
          />
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <KpiCard
            icon={DollarSign}
            color="#2ca6a4"
            label="Total Facturado"
            value={fmt(stats.totalFacturado)}
            subtitle="Último período"
            trend="up"
          />
          <KpiCard
            icon={FileText}
            color="#36b6b0"
            label="Facturas Emitidas"
            value={stats.emitidas}
            subtitle="Registradas en Convex"
            trend="up"
          />
          <KpiCard
            icon={FileText}
            color="#e6b800"
            label="Pendientes de Pago"
            value={stats.pendientes}
            subtitle="Facturas abiertas"
            trend="down"
          />
          <KpiCard
            icon={FileText}
            color="#ff5c5c"
            label="Vencidas"
            value={stats.vencidas}
            subtitle="Requieren seguimiento"
            trend="down"
          />
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white dark:bg-[#11292e] rounded-xl shadow-md border border-[#e1efef] dark:border-[#1e3c42] p-6">
        <h2 className="text-xl font-bold text-[#1a3b47] dark:text-[#e8f8f8] mb-4">
          Listado de Facturas
        </h2>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f2fafa] dark:bg-[#0e2529] text-[#4b6a6e] dark:text-[#9ed1cd]">
              <th className="p-3">Factura Nº</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Total</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((f: any) => (
              <tr
                key={f._id}
                className="border-t border-[#d8ecec] dark:border-[#1e3c42] hover:bg-[#eefafa] dark:hover:bg-[#15393f] transition"
              >
                <td className="p-3 text-[#1a3b47] dark:text-[#d6f4f4] font-medium">
                  {f.numero}
                </td>
                <td className="p-3 text-[#1a3b47] dark:text-[#d6f4f4]">
                  {f.clienteNombre}
                </td>
                <td className="p-3 text-[#1a3b47] dark:text-[#d6f4f4]">
                  {f.fecha}
                </td>
                <td className="p-3 text-[#1a3b47] dark:text-[#d6f4f4]">
                  {fmt(f.total)}
                </td>
                <td className="p-3">
                  <EstadoPill estado={f.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- COMPONENTES ---------- */

function KpiCard({ icon: Icon, color, label, value, subtitle, trend }: any) {
  const TrendIcon =
    trend === "up" ? (
      <ArrowUpRight className="text-green-500" size={18} />
    ) : (
      <ArrowDownRight className="text-red-500" size={18} />
    );

  return (
    <div className="bg-white dark:bg-[#11292e] rounded-xl shadow-md p-6 relative border border-[#e1efef] dark:border-[#1e3c42] transition hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: `${color}22` }}
          >
            {Icon ? <Icon style={{ color }} size={28} /> : null}
          </div>
          <div>
            <p className="text-[#688b8f] dark:text-[#93c6c1] text-sm mb-1">
              {label}
            </p>
            <p className="text-3xl font-bold text-[#1a3b47] dark:text-[#e8f8f8]">
              {value}
            </p>
          </div>
        </div>
        {TrendIcon}
      </div>
      {subtitle && (
        <p className="mt-2 text-sm text-[#688b8f] dark:text-[#93c6c1]">
          {subtitle}
        </p>
      )}
      <MoreVertical
        className="absolute right-4 top-4 text-[#9dbcbc] dark:text-[#7bbdb7] cursor-pointer"
        size={18}
      />
    </div>
  );
}

function EstadoPill({ estado }: { estado: string }) {
  const map: any = {
    PAGADA:
      "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300",
    VENCIDA:
      "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300",
    PENDIENTE:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300",
    EMITIDA:
      "bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300",
  };
  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full ${
        map[estado] ?? ""
      }`}
    >
      {estado}
    </span>
  );
}
