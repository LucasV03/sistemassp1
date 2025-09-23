"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function ListaDeClientes() {
  const [busqueda, setBusqueda] = useState("");
  const clientes = useQuery(api.clientes.listar, { busqueda }) ?? [];

  return (
    <div className="p-8 bg-black min-h-screen text-white space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Clientes</h1>
        <p className="text-gray-300">
          Listado y acceso al detalle de cada cliente.
        </p>
      </header>

      {/* Barra de búsqueda + botón nuevo */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <input
          className="bg-white border border-gray-300 rounded px-3 py-2 text-black placeholder-gray-500 w-full md:max-w-md"
          placeholder="Buscar por nombre, correo o empresa…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <Link
          href="/clientes/nuevo"
          className="px-4 py-2 rounded bg-white text-black font-semibold hover:bg-gray-200 inline-flex items-center justify-center"
        >
          + Nuevo cliente
        </Link>
      </div>

      {/* Tabla de clientes */}
      {clientes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden text-black">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Correo</th>
                <th className="px-4 py-2">Empresa</th>
                <th className="px-4 py-2">Teléfono</th>
                <th className="px-4 py-2">Notas</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c: any) => (
                <tr key={c._id} className="border-t">
                  <td className="px-4 py-2 font-medium">{c.nombre}</td>
                  <td className="px-4 py-2">{c.correo}</td>
                  <td className="px-4 py-2">{c.empresa || "-"}</td>
                  <td className="px-4 py-2">{c.telefono || "-"}</td>
                  <td className="px-4 py-2 max-w-xs truncate">
                    {c.notas || ""}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      className="underline font-medium hover:no-underline text-blue-600"
                      href={`/clientes/${c._id}`}
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
        <div className="bg-white rounded-2xl shadow p-6 text-black">
          No se encontraron clientes con ese criterio.
        </div>
      )}
    </div>
  );
}
