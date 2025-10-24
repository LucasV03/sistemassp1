"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  FileText,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import TarifasVehiculosTable from "./_components/TarifasVehiculosTable";

export default function FacturasVentasPage() {
  const facturas = useQuery(api.facturas_ventas.listarConCliente) ?? [];
  const stats = useQuery(api.facturas_ventas.estadisticas);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");

  // 🔹 Filtrar por búsqueda y estado
  const filtradas = useMemo(() => {
    return facturas.filter((f: any) => {
      const texto = `${f.numero} ${f.clienteRazonSocial} ${f.clienteAlias}`.toLowerCase();
      const matchBusqueda = texto.includes(busqueda.toLowerCase());
      const matchEstado = estado ? f.estado === estado : true;
      return matchBusqueda && matchEstado;
    });
  }, [facturas, busqueda, estado]);

  return (
    <div className="min-h-screen bg-[#0d1b1e] p-8 text-[#e8f9f9] space-y-8">
      {/* ---------- HEADER ---------- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Facturación a Clientes</h1>
          <p className="text-[#a8d8d3] text-sm">
            Gestión de comprobantes de venta y control de cobros.
          </p>
        </div>

        {/* ---------- ACCIONES ---------- */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* 🔍 Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-[#7ca6a8]" size={18} />
            <input
              type="text"
              placeholder="Buscar cliente o factura..."
              className="pl-9 pr-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 placeholder-gray-400 w-64 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* ➕ Nueva factura */}
          <Link
            href="/facturas-ventas/nueva"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2ca6a4] hover:bg-[#249390] text-white font-semibold shadow-sm"
          >
            <Plus size={18} /> Nueva factura
          </Link>

          {/* 🧾 Exportar PDF */}
          <button
            onClick={() => alert("Funcionalidad de exportación PDF próximamente 🧾")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#24474d] hover:bg-[#2f6368] text-[#e8f9f9] font-semibold border border-[#2f6368]"
          >
            <FileText size={18} /> Exportar PDF
          </button>

          {/* 📊 Reportes */}
          <Link
            href="/reportes/facturacion"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1b3a3f] hover:bg-[#23454e] text-[#a8d8d3] font-semibold border border-[#2f6368]"
          >
            <ArrowUpRight size={18} /> Reportes
          </Link>
          
        </div>
        
      </div>

      {/* ---------- KPIs ---------- */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            icon={FileText}
            color="#36b6b0"
            label="Total Facturado"
            value={stats.totalFormateado}
            trend="up"
          />
          <KpiCard
            color="#2ca6a4"
            label="Emitidas"
            value={stats.emitidas}
            trend="up"
          />
          <KpiCard
            color="#e6b800"
            label="Pendientes"
            value={stats.pendientes}
            trend="neutral"
          />
          <KpiCard
            color="#ff5c5c"
            label="Vencidas"
            value={stats.vencidas}
            trend="down"
          />
        </div>
      )}

      {/* ---------- FILTROS ---------- */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="bg-[#11292e] border border-[#1e3c42] text-gray-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#36b6b0]"
        >
          <option value="">Todos los estados</option>
          <option value="EMITIDA">Emitida</option>
          <option value="PAGADA">Pagada</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="VENCIDA">Vencida</option>
        </select>
      </div>

      {/* ---------- TABLA ---------- */}
      <div className="bg-[#11292e] rounded-2xl shadow-md border border-[#1e3c42] overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-[#0e2529] text-[#9ed1cd]">
            <tr>
              <th className="p-3 font-medium">Cliente</th>
              <th className="p-3 font-medium">CUIT</th>
              <th className="p-3 font-medium">Comprobante</th>
              <th className="p-3 font-medium">Fecha</th>
              <th className="p-3 font-medium">Hora</th>
              <th className="p-3 font-medium text-right">Total</th>
              <th className="p-3 font-medium text-center">Estado</th>
              <th className="p-3 font-medium text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length > 0 ? (
              filtradas.map((f: any) => (
                <tr
                  key={f._id}
                  className="border-t border-[#1e3c42] hover:bg-[#15393f] transition"
                >
                  <td className="p-3">{f.clienteRazonSocial}</td>
                  <td className="p-3">{f.clienteCuit}</td>
                  <td className="p-3">{f.numero}</td>
                  <td className="p-3">
                    {new Date(f.fecha).toLocaleDateString("es-AR")}
                  </td>
                  <td className="p-3">{f.hora}</td>
                  <td className="p-3 text-right">{f.totalFormateado}</td>
                  <td className="p-3 text-center">
                    <EstadoPill estado={f.estado} />
                  </td>
                  <td className="p-3 text-center">
                    <Link
                      href={`/facturas-ventas/${f._id}`}
                      className="px-3 py-1 rounded bg-[#36b6b0] hover:bg-[#2ca6a4] text-white text-xs font-semibold"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-6 text-gray-400 italic"
                >
                  No hay facturas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <TarifasVehiculosTable />
    </div>
  );
}

/* ---------- COMPONENTES AUXILIARES ---------- */

function KpiCard({ icon: Icon, color, label, value, trend }: any) {
  const TrendIcon =
    trend === "up" ? (
      <ArrowUpRight className="text-emerald-400 animate-pulse" size={20} />
    ) : trend === "down" ? (
      <ArrowDownRight className="text-red-400 animate-pulse" size={20} />
    ) : (
      <span className="text-gray-400 text-xs">—</span>
    );

  return (
    <div className="bg-gradient-to-br from-[#0f2225] to-[#11292e] border border-[#1e3c42]/60 rounded-2xl shadow-lg p-5 flex flex-col justify-between hover:border-[#2ca6a4]/60 hover:shadow-[#2ca6a4]/20 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-3 rounded-2xl shadow-inner"
            style={{
              backgroundColor: `${color}22`,
              boxShadow: `0 0 10px ${color}33 inset`,
            }}
          >
            {Icon && <Icon style={{ color }} size={28} />}
          </div>
          <div>
            <p className="text-sm text-[#8abbb7] tracking-wide">{label}</p>
            <p className="text-2xl md:text-3xl font-bold text-[#e8f9f9] mt-1 drop-shadow-sm">
              {value ?? "—"}
            </p>
          </div>
        </div>
        <div>{TrendIcon}</div>
      </div>
    </div>
  );
}


function EstadoPill({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    EMITIDA: "bg-blue-800/30 text-blue-300",
    PAGADA: "bg-green-800/30 text-green-300",
    VENCIDA: "bg-red-800/30 text-red-300",
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
