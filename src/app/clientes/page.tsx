"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Search, UserPlus } from "lucide-react";

export default function ListaDeClientes() {
  const [busqueda, setBusqueda] = useState("");
  const clientes = useQuery(api.clientes.listar, { busqueda }) ?? [];

  return (
    <div className="min-h-screen bg-[#1b3a3f] p-6 space-y-8 transition-colors duration-300">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#e6f6f7]">Clientes</h1>
          <p className="text-[#a8d8d3] text-sm">
            Listado general y acceso al detalle de cada cliente.
          </p>
        </div>

        {/* Botón Nuevo cliente */}
        <Link
          href="/clientes/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2ca6a4] hover:bg-[#249390] text-white font-semibold transition-colors shadow-sm"
        >
          <UserPlus size={18} />
          Nuevo Cliente
        </Link>
      </header>

      {/* Barra de búsqueda */}
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-2.5 text-[#5ba7a1]" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre, correo o empresa…"
          className="pl-10 pr-4 py-2 border border-[#2c5a60] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#36b6b0] bg-[#24474d] text-gray-100 w-full shadow-sm placeholder:text-gray-400"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla de clientes */}
      <div className="bg-[#24474d] rounded-xl shadow-md border border-[#2f6368] overflow-hidden">
        {clientes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2b5a60] text-[#b7e2de] text-sm">
                  <th className="p-3 font-medium">Nombre</th>
                  <th className="p-3 font-medium">Correo</th>
                  <th className="p-3 font-medium">Empresa</th>
                  <th className="p-3 font-medium">Teléfono</th>
                  <th className="p-3 font-medium">Notas</th>
                  <th className="p-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c: any) => (
                  <tr
                    key={c._id}
                    className="border-t border-[#2f6368] hover:bg-[#2b5a60] transition"
                  >
                    <td className="p-3 text-[#e2f7f6] font-medium">
                      {c.nombre}
                    </td>
                    <td className="p-3 text-[#e2f7f6]">{c.correo}</td>
                    <td className="p-3 text-[#e2f7f6]">{c.empresa || "—"}</td>
                    <td className="p-3 text-[#e2f7f6]">{c.telefono || "—"}</td>
                    <td className="p-3 text-[#e2f7f6] max-w-xs truncate">
                      {c.notas || ""}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/clientes/${c._id}`}
                        className="text-[#36b6b0] font-semibold hover:underline"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-[#b7e2de]">
            No se encontraron clientes con ese criterio.
          </div>
        )}
      </div>
    </div>
  );
}
