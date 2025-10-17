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
    <div className="min-h-screen bg-[#0d1b1e] p-6 space-y-8 transition-colors duration-300">
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
        <Search className="absolute left-3 top-2.5 text-[#7ca6a8]" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre, correo o empresa…"
          className="pl-10 pr-4 py-2 border border-[#23454e] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#36b6b0] bg-[#11292e] text-gray-200 w-full shadow-sm placeholder:text-gray-400"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla de clientes */}
      <div className="bg-[#11292e] rounded-2xl shadow-md border border-[#1e3c42] overflow-hidden">
        {clientes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0e2529] text-[#9ed1cd] text-sm">
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
                    className="border-t border-[#1e3c42] hover:bg-[#15393f] transition"
                  >
                    <td className="p-3 text-[#d6f4f4] font-medium">
                      {c.nombre}
                    </td>
                    <td className="p-3 text-[#d6f4f4]">{c.correo}</td>
                    <td className="p-3 text-[#d6f4f4]">{c.empresa || "—"}</td>
                    <td className="p-3 text-[#d6f4f4]">{c.telefono || "—"}</td>
                    <td className="p-3 text-[#d6f4f4] max-w-xs truncate">
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
          <div className="p-6 text-center text-gray-400">
            No se encontraron clientes con ese criterio.
          </div>
        )}
      </div>
    </div>
  );
}
