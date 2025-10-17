"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import {
  Search,
  User,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  PlusCircle,
} from "lucide-react";

export default function ChoferesPage() {
  const data = useQuery(api.choferes.listar) ?? [];
  const stats = useQuery(api.choferes.estadisticas) ?? {
    total: 0,
    activos: 0,
    inactivos: 0,
  };

  const eliminar = useMutation(api.choferes.eliminar);
  const [busqueda, setBusqueda] = useState("");

  const handleEliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar al chofer ${nombre}?`)) return;
    await eliminar({ id: id as any });
  };

  const filtrados = data.filter((c: any) => {
    const texto = `${c.nombre} ${c.apellido} ${c.dni}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#f8fafa] dark:bg-[#0b1618] p-6 transition-colors">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#1a3b47] dark:text-[#e6f6f7]">
          Choferes
        </h1>

        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar chofer..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 pr-4 py-2 border border-[#d2e6e9] dark:border-[#23454e] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#36b6b0] bg-white dark:bg-[#11292e] text-gray-700 dark:text-gray-200 w-64 shadow-sm"
            />
            <Search
              className="absolute left-3 top-2.5 text-[#7ca6a8]"
              size={20}
            />
          </div>

          <Link
            href="/choferes/nuevo"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-medium transition"
          >
            <PlusCircle size={18} /> Nuevo
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <KpiCard label="Total Choferes" value={stats.total} color="#36b6b0" />
        <KpiCard label="Activos" value={stats.activos} color="#2ca6a4" />
        <KpiCard label="Inactivos" value={stats.inactivos} color="#ff5c5c" />
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-[#11292e] rounded-2xl shadow-md border border-[#e1efef] dark:border-[#1e3c42] p-6 transition-all">
        <h2 className="text-xl font-bold text-[#1a3b47] dark:text-[#e8f8f8] mb-4">
          Listado de Choferes
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f2fafa] dark:bg-[#0e2529] text-[#4b6a6e] dark:text-[#9ed1cd] text-sm">
                <th className="p-3">Nombre y Apellido</th>
                <th className="p-3">DNI</th>
                <th className="p-3">Licencia</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-6 text-gray-500 dark:text-gray-400"
                  >
                    No se encontraron choferes.
                  </td>
                </tr>
              )}

              {filtrados.map((c: any) => (
                <tr
                  key={c._id}
                  className="border-t border-[#d8ecec] dark:border-[#1e3c42] hover:bg-[#eefafa] dark:hover:bg-[#15393f] transition"
                >
                  <td className="p-3 text-[#1a3b47] dark:text-[#d6f4f4] font-medium">
                    {c.nombre} {c.apellido}
                  </td>
                  <td className="p-3 text-[#1a3b47]  dark:text-[#d6f4f4] font-medium">{c.dni}</td>
                  <td className="p-3 text-[#1a3b47]  dark:text-[#d6f4f4] font-medium">{c.licencia}</td>
                  <td className="p-3 text-[#1a3b47]  dark:text-[#d6f4f4] font-medium">{c.telefono || "—"}</td>
                  <td className="p-3">
                    <Estado estado={c.estado} />
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-3">
                      <Link
                        href={`/choferes/${c._id}`}
                        className="text-[#36b6b0] hover:text-[#2ca6a4] transition"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </Link>
                      <button
                        onClick={() =>
                          handleEliminar(c._id, `${c.nombre} ${c.apellido}`)
                        }
                        className="text-red-500 hover:text-red-600 transition"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
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

/* === COMPONENTES AUXILIARES === */

function KpiCard({ label, value, color }: any) {
  return (
    <div className="bg-white dark:bg-[#11292e] rounded-xl shadow-md p-6 border border-[#e1efef] dark:border-[#1e3c42] transition">
      <div className="flex items-center gap-4">
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: `${color}22` }}
        >
          <User style={{ color }} size={28} />
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
    </div>
  );
}

function Estado({ estado }: { estado: string }) {
  const map: any = {
    ACTIVO:
      "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300",
    INACTIVO:
      "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300",
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
