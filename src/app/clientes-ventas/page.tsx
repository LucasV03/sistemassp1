"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Search, UserPlus, Eye } from "lucide-react";

export default function ClientesVentasPage() {
  const [busqueda, setBusqueda] = useState("");
  const clientes = useQuery(api.clientes_ventas.listar, { busqueda }) ?? [];

  return (
    <div className="min-h-screen bg-[#1b3a3f] p-6 space-y-8 text-[#e6f6f7]">
      {/* 🔹 Encabezado */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes de Ventas</h1>
          <p className="text-[#a8d8d3] text-sm">
            Gestión de clientes activos e inactivos.
          </p>
        </div>
        <Link
          href="/clientes-ventas/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2ca6a4] hover:bg-[#249390] text-white font-semibold shadow-sm"
        >
          <UserPlus size={18} /> Nuevo Cliente
        </Link>
      </header>

      {/* 🔹 Buscador */}
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-2.5 text-[#5ba7a1]" size={20} />
        <input
          type="text"
          placeholder="Buscar por alias, CUIT o razón social…"
          className="pl-10 pr-4 py-2 border border-[#2c5a60] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#36b6b0] bg-[#24474d] text-gray-100 w-full shadow-sm placeholder:text-gray-400"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* 🔹 Tabla de resultados */}
      <div className="bg-[#24474d] rounded-xl border border-[#2f6368] overflow-hidden">
        {clientes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2b5a60] text-[#b7e2de] text-sm">
                  <th className="p-3 font-medium">Alias / Nombre Comercial</th>
                  <th className="p-3 font-medium">Razón Social</th>
                  <th className="p-3 font-medium">CUIT</th>
                  <th className="p-3 font-medium">Teléfono</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Estado</th>
                  <th className="p-3 font-medium text-center">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {clientes.map((c: any) => (
                  <tr
                    key={c._id}
                    className="border-t border-[#2f6368] hover:bg-[#2b5a60] transition"
                  >
                    <td className="p-3">
                      {c.alias && c.alias.trim() !== ""
                        ? c.alias
                        : c.razonSocial}
                    </td>
                    <td className="p-3 text-[#a8d8d3]">{c.razonSocial}</td>
                    <td className="p-3">{c.cuit}</td>
                    <td className="p-3">{c.telefono || "—"}</td>
                    <td className="p-3">{c.email || "—"}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-semibold ${
                          c.estado === "ACTIVO"
                            ? "bg-green-800/30 text-green-300"
                            : "bg-red-800/30 text-red-300"
                        }`}
                      >
                        {c.estado}
                      </span>
                    </td>

                    {/* 🔹 Botón Ver Detalle */}
                    <td className="p-3 text-center">
                      <Link
                        href={`/clientes-ventas/${c._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2ca6a4] hover:bg-[#249390] text-white text-xs font-medium transition"
                      >
                        <Eye size={14} /> Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-[#b7e2de]">
            No se encontraron clientes.
          </div>
        )}
      </div>
    </div>
  );
}
