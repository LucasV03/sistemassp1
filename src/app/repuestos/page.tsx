// src/app/repuestos/page.tsx
"use client";

import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useMemo } from "react";

export default function RepuestosPage() {
  const list = useQuery(api.repuestos.listar) ?? [];
  const eliminarRepuesto = useMutation(api.repuestos.eliminar);

  // Buscador global
  const [buscar, setBuscar] = useState("");

  // Filtros
  const [marcaFiltro, setMarcaFiltro] = useState("");
  const [modeloFiltro, setModeloFiltro] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [vehiculoFiltro, setVehiculoFiltro] = useState("");

  // Normalizador
  const norm = (s: any) =>
    (s ?? "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  // Opciones únicas para selects
  const marcas = [...new Set(list.map((r: any) => r.marca).filter(Boolean))];
  const modelos = [...new Set(list.map((r: any) => r.modeloCompatible).filter(Boolean))];
  const categorias = [...new Set(list.map((r: any) => r.categoria).filter(Boolean))];
  const vehiculos = [...new Set(list.map((r: any) => r.vehiculo).filter(Boolean))];

  // Filtrado combinado
  const filtered = useMemo(() => {
    const q = norm(buscar).trim();

    return list.filter((r: any) => {
      // Filtros select
      if (marcaFiltro && r.marca !== marcaFiltro) return false;
      if (modeloFiltro && r.modeloCompatible !== modeloFiltro) return false;
      if (categoriaFiltro && r.categoria !== categoriaFiltro) return false;
      if (vehiculoFiltro && r.vehiculo !== vehiculoFiltro) return false;

      // Buscador general
      if (q) {
        const fields = [
          r.codigo,
          r.nombre,
          r.descripcion,
          r.categoria,
          r.vehiculo,
          r.marca,
          r.modeloCompatible,
          r.precioUnitario?.toString(),
        ];
        return fields.map(norm).some((x) => x.includes(q));
      }

      return true;
    });
  }, [list, buscar, marcaFiltro, modeloFiltro, categoriaFiltro, vehiculoFiltro]);

  return (
    // Fondo principal: Usamos el color oscuro `#0b1618`
    <div className="min-h-screen bg-[#0b1618] p-6 space-y-4 text-gray-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">📦 Repuestos</h1>
        <div className="flex gap-2">
          {/* Botón Asignar Repuesto (teal/acento) */}
          <Link
            href="/repuestos/asignar"
            className="px-4 py-2 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-semibold transition shadow-md"
          >
            Asignar Repuesto
          </Link>
          {/* Botón Nuevo Repuesto (teal/acento) */}
          <Link
            href="/repuestos/nuevo"
            className="px-4 py-2 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-semibold transition shadow-md"
          >
            Nuevo Repuesto
          </Link>
        </div>
      </div>

      {/* Buscador + filtros */}
      <div className="flex flex-wrap gap-3 items-center p-4 rounded-xl bg-[#11292e] border border-[#1e3c42] shadow-lg">
        {/* Buscador */}
        <input
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar..."
          // Input ajustado para la estética oscura
          className="px-3 py-2 text-sm rounded-lg border border-[#1e3c42] bg-[#1a3035] text-white min-w-[250px] placeholder-gray-400 focus:ring-2 focus:ring-[#36b6b0] outline-none"
        />
        {buscar && (
          <button
            onClick={() => setBuscar("")}
            // Botón Limpiar ajustado
            className="px-3 py-2 text-sm rounded-lg border border-[#1e3c42] bg-[#1a3035] hover:bg-[#1e3c42] text-gray-300 transition"
          >
            Limpiar
          </button>
        )}

        {/* Select filtros - Ajustados para la estética oscura */}
        <select
          value={marcaFiltro}
          onChange={(e) => setMarcaFiltro(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#1e3c42] bg-[#1a3035] text-gray-300 text-sm focus:ring-2 focus:ring-[#36b6b0] outline-none"
        >
          <option value="">Todas las marcas</option>
          {marcas.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={modeloFiltro}
          onChange={(e) => setModeloFiltro(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#1e3c42] bg-[#1a3035] text-gray-300 text-sm focus:ring-2 focus:ring-[#36b6b0] outline-none"
        >
          <option value="">Todos los modelos</option>
          {modelos.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#1e3c42] bg-[#1a3035] text-gray-300 text-sm focus:ring-2 focus:ring-[#36b6b0] outline-none"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={vehiculoFiltro}
          onChange={(e) => setVehiculoFiltro(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#1e3c42] bg-[#1a3035] text-gray-300 text-sm focus:ring-2 focus:ring-[#36b6b0] outline-none"
        >
          <option value="">Todos los vehículos</option>
          {vehiculos.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla con scroll */}
      <div className="rounded-xl border border-[#1e3c42] overflow-hidden bg-[#11292e] shadow-lg">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            {/* Encabezado de la tabla */}
            <thead className="bg-[#1e3c42] sticky top-0 z-10 text-gray-300">
              <tr>
                <th className="p-3 text-left">Código</th>
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-left">Descripción</th>
                <th className="p-3 text-left">Categoría</th>
                <th className="p-3 text-left">Vehículo</th>
                <th className="p-3 text-left">Marca</th>
                <th className="p-3 text-left">Modelo</th>
                
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr
                  key={r._id}
                  // Fila ajustada
                  className="border-t border-[#1e3c42] hover:bg-[#1a3035] transition"
                >
                  <td className="p-3 font-medium text-white">{r.codigo}</td>
                  <td className="p-3 text-gray-300">{r.nombre}</td>
                  <td className="p-3 max-w-[280px] truncate text-gray-400" title={r.descripcion}>
                    {r.descripcion}
                  </td>
                  <td className="p-3 text-gray-400">{r.categoria}</td>
                  <td className="p-3 text-gray-400">{r.vehiculo}</td>
                  <td className="p-3 text-gray-400">{r.marca}</td>
                  <td className="p-3 text-gray-400">{r.modeloCompatible}</td>
                  
                  <td className="p-3">
                    <div className="flex gap-2 justify-end">
                      {/* Botón Ver (secundario) */}
                      <Link
                        className="px-3 py-1.5 rounded-lg bg-[#1e3c42] hover:bg-[#2b5a60] text-gray-300 text-xs font-medium transition"
                        href={`/repuestos/${r._id}`}
                      >
                        Ver
                      </Link>
                      {/* Botón Editar (teal/acento) */}
                      <Link
                        className="px-3 py-1.5 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white text-xs font-medium transition"
                        href={`/repuestos/${r.codigo}/editar`}
                      >
                        Editar
                      </Link>
                      {/* Botón Eliminar (Rojo ajustado) */}
                      <button
                        onClick={() => eliminarRepuesto({ id: r._id })}
                        className="px-3 py-1.5 rounded-lg bg-red-700/70 hover:bg-red-600/80 text-white text-xs font-medium transition"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-gray-400">
                    No se encontraron repuestos.
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