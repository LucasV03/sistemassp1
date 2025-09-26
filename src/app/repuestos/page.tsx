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
    <div className="p-6 space-y-4 text-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">📦 Repuestos</h1>
        <div className="flex gap-2">
          <Link
            href="/repuestos/asignar"
            className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white"
          >
            Asignar Repuesto
          </Link>
          <Link
            href="/repuestos/nuevo"
            className="px-4 py-2 rounded bg-violet-600 text-white"
          >
            Nuevo Repuesto
          </Link>
        </div>
      </div>

      {/* Buscador + filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Buscador */}
        <input
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar..."
          className="px-3 py-2 text-sm rounded-lg border border-neutral-700 bg-zinc-900 text-white min-w-[250px]"
        />
        {buscar && (
          <button
            onClick={() => setBuscar("")}
            className="px-3 py-2 text-sm rounded border border-neutral-600 bg-neutral-800 hover:bg-neutral-700"
          >
            Limpiar
          </button>
        )}

        {/* Select filtros */}
        <select
          value={marcaFiltro}
          onChange={(e) => setMarcaFiltro(e.target.value)}
          className="px-3 py-2 rounded border border-neutral-700 bg-zinc-900 text-white text-sm"
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
          className="px-3 py-2 rounded border border-neutral-700 bg-zinc-900 text-white text-sm"
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
          className="px-3 py-2 rounded border border-neutral-700 bg-zinc-900 text-white text-sm"
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
          className="px-3 py-2 rounded border border-neutral-700 bg-zinc-900 text-white text-sm"
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
      <div className="rounded border border-neutral-800 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 sticky top-0 z-10">
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
                  className="border-t border-neutral-800 hover:bg-neutral-900/40"
                >
                  <td className="p-3">{r.codigo}</td>
                  <td className="p-3">{r.nombre}</td>
                  <td className="p-3 max-w-[280px] truncate" title={r.descripcion}>
                    {r.descripcion}
                  </td>
                  <td className="p-3">{r.categoria}</td>
                  <td className="p-3">{r.vehiculo}</td>
                  <td className="p-3">{r.marca}</td>
                  <td className="p-3">{r.modeloCompatible}</td>
                  
                  <td className="p-3">
                    <div className="flex gap-2 justify-end">
                      <Link
                        className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
                        href={`/repuestos/${r._id}`}
                      >
                        Ver
                      </Link>
                      <Link
                        className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white"
                        href={`/repuestos/${r.codigo}/editar`}
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => eliminarRepuesto({ id: r._id })}
                        className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-neutral-400">
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
