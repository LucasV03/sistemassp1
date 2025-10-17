// src/app/depositos/page.tsx
"use client";

import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useMemo } from "react";
import Link from "next/link";

export default function DepositosPage() {
  // === DATA ===
  const depositos = useQuery(api.depositos.listar) || [];
  const eliminarDeposito = useMutation(api.depositos.eliminar);

  // Ocupación de cada depósito
  const ocupados =
    useQuery(api.repuestos_por_deposito.ocupadoPorDeposito, {
      depositoId: undefined,
    }) || {};

  // === UI STATE ===
  const [selectedDeposito, setSelectedDeposito] = useState<string | "all">(
    "all"
  );
  const [q, setQ] = useState("");

  // Lista de repuestos del depósito expandido (cuando se elige uno)
  const repuestosPorDeposito =
    useQuery(api.repuestos_por_deposito.listarPorDeposito, {
      depositoId:
        selectedDeposito === "all" ? undefined : (selectedDeposito as any),
    }) || [];

  // === HELPERS ===
  const normalize = (v: unknown) =>
    (v ?? "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      // @ts-ignore: unicode regex for diacritics
      .replace(/\p{Diacritic}/gu, "");

  // Filtrado por búsqueda (no altera el cálculo de stats)
  const depositosFiltrados = useMemo(() => {
    if (!q) return depositos;
    const nq = normalize(q);
    return (depositos as any[]).filter((d) => {
      const nombre = normalize(d.nombre);
      const provincia = normalize(d.provincia);
      const ciudad = normalize(d.ciudad);
      const calle = normalize(d.calle);
      const cp = normalize(d.codigoPostal);
      return (
        nombre.includes(nq) ||
        provincia.includes(nq) ||
        ciudad.includes(nq) ||
        calle.includes(nq) ||
        cp.includes(nq)
      );
    });
  }, [depositos, q]);

  // === CÁLCULO DE ESTADÍSTICAS ===
  // Mantengo el comportamiento original: stats dependen de "selectedDeposito", no de la búsqueda.
  const stats = useMemo(() => {
    if (!depositos || !ocupados) return null;

    let filtered = depositos as any[];
    if (selectedDeposito !== "all") {
      filtered = (depositos as any[]).filter((d) => d._id === selectedDeposito);
    }

    let capacidadTotal = 0;
    let ocupado = 0;

    for (const d of filtered) {
      capacidadTotal += d.capacidad_total || 0;
      ocupado += ocupados[d._id] || 0;
    }

    const porcentaje =
      capacidadTotal > 0 ? ((ocupado / capacidadTotal) * 100).toFixed(1) : "0";

    return {
      capacidadTotal,
      ocupado,
      porcentaje,
      cantidadDepositos: filtered.length,
    };
  }, [depositos, ocupados, selectedDeposito]);

  const handleDelete = async (id: string) => {
    await eliminarDeposito({ id: id as any });
  };

  const clearSearch = () => setQ("");

  return (
    // Fondo principal: Usamos el color oscuro `#0b1618`
    <div className="min-h-screen bg-[#0b1618] text-gray-100 p-6 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-white">Gestión de Depósitos</h1>
        {/* Botón Nuevo depósito (teal/acento) */}
        <Link
          href="/depositos/nuevo"
          className="inline-flex items-center justify-center rounded-lg bg-[#36b6b0] px-4 py-2 text-white hover:bg-[#2ca6a4] transition font-semibold shadow-md"
        >
          Nuevo depósito
        </Link>
      </div>

      {/* CONTROLES: STATS + SELECT + BUSCADOR */}
      {stats && (
        <>
          {/* Stats - Usamos el color de caja/fondo secundario: `#11292e` */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#11292e] border border-[#1e3c42] rounded-xl p-4 shadow-lg">
              <p className="text-sm text-gray-400">Capacidad total</p>
              <p className="text-2xl font-bold text-white">{stats.capacidadTotal}</p>
            </div>
            <div className="bg-[#11292e] border border-[#1e3c42] rounded-xl p-4 shadow-lg">
              <p className="text-sm text-gray-400">Ocupado</p>
              <p className="text-2xl font-bold text-white">{stats.ocupado}</p>
            </div>
            <div className="bg-[#11292e] border border-[#1e3c42] rounded-xl p-4 shadow-lg">
              <p className="text-sm text-gray-400">% Ocupado</p>
              <p className="text-2xl font-bold text-white">{stats.porcentaje}%</p>
            </div>
            <div className="bg-[#11292e] border border-[#1e3c42] rounded-xl p-4 shadow-lg">
              <p className="text-sm text-gray-400"># Depósitos</p>
              <p className="text-2xl font-bold text-white">{stats.cantidadDepositos}</p>
            </div>
          </div>

          {/* Filtros superiores: Select + Buscador */}
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Select de depósito */}
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="depositoSelect">
                Selecciona depósito
              </label>
              <select
                id="depositoSelect"
                // Select ajustado para la estética oscura
                className="w-[260px] bg-[#1a3035] text-gray-100 border border-[#1e3c42] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
                value={selectedDeposito}
                onChange={(e) => setSelectedDeposito(e.target.value as any)}
              >
                <option value="all">Todos</option>
                {depositos?.map((d: any) => (
                  <option key={d._id} value={d._id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Buscador */}
            <div className="relative w-full md:w-[360px]">
              <label htmlFor="searchDepositos" className="sr-only">
                Buscar depósitos
              </label>
              <input
                id="searchDepositos"
                type="text"
                placeholder="Buscar por nombre, ubicación, dirección o CP…"
                // Input ajustado para la estética oscura
                className="w-full bg-[#1a3035] text-gray-100 placeholder-gray-400 border border-[#1e3c42] rounded-lg pl-10 pr-9 py-2 outline-none focus:ring-2 focus:ring-[#36b6b0]"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {/* Icono lupa */}
              <span
                aria-hidden
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                🔎
              </span>
              {/* Botón clear */}
              {q && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  aria-label="Limpiar búsqueda"
                  title="Limpiar"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* TABLA DE DEPÓSITOS */}
      {/* Contenedor principal de la tabla - Usamos el color de caja/fondo secundario: `#11292e` */}
      <div className="bg-[#11292e] border border-[#1e3c42] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            {/* Encabezado de la tabla */}
            <thead className="bg-[#1e3c42] text-gray-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Ubicación</th>
                <th className="px-4 py-3 font-semibold">Dirección</th>
                <th className="px-4 py-3 font-semibold">CP</th>
                <th className="px-4 py-3 font-semibold">Capacidad</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3c42]">
              {depositosFiltrados?.map((d: any) => {
                const isExpanded = selectedDeposito === d._id;
                return (
                  <React.Fragment key={d._id}>
                    {/* Fila del depósito */}
                    <tr className="hover:bg-[#1a3035] transition">
                      <td className="px-4 py-3 font-medium text-white">{d.nombre}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {d.provincia} - {d.ciudad}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{d.calle}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {d.codigoPostal}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {d.capacidad_total ?? "Sin límite"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {/* Botón Ver (teal/acento) */}
                          <Link
                            href={`/depositos/${d._id}`}
                            className="rounded-lg bg-[#36b6b0] px-3 py-1.5 text-white hover:bg-[#2ca6a4] transition text-xs font-medium"
                          >
                            Ver
                          </Link>
                          {/* Botón Editar (teal/acento) */}
                          <Link
                            href={`/depositos/${d._id}/editar`}
                            className="rounded-lg bg-[#36b6b0] px-3 py-1.5 text-white hover:bg-[#2ca6a4] transition text-xs font-medium"
                          >
                            Editar
                          </Link>
                          {/* Botón Eliminar (Rojo ajustado) */}
                          <button
                            className="rounded-lg bg-red-700/70 px-3 py-1.5 text-white hover:bg-red-600/80 transition text-xs font-medium"
                            onClick={() => handleDelete(d._id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Fila expandida con repuestos del depósito seleccionado */}
                    {isExpanded && (
                      <tr key={`${d._id}-expanded`}>
                        {/* Fondo de la fila expandida ligeramente diferente para distinción */}
                        <td colSpan={6} className="bg-[#1a3035] px-4 py-4 border-t border-[#1e3c42]">
                          <div>
                            <h2 className="text-base font-semibold mb-3 text-white">
                              Repuestos en este depósito
                            </h2>

                            <div className="overflow-x-auto rounded-lg ring-1 ring-[#1e3c42]">
                              <table className="min-w-full text-sm">
                                {/* Encabezado de la tabla interna */}
                                <thead className="bg-[#1e3c42] text-gray-300">
                                  <tr>
                                    <th className="px-3 py-2 font-medium text-left">Repuesto</th>
                                    <th className="px-3 py-2 font-medium text-left">Cantidad</th>
                                  </tr>
                                </thead>
                                {/* Cuerpo de la tabla interna */}
                                <tbody className="divide-y divide-[#1e3c42]">
                                  {repuestosPorDeposito.map((r: any) => (
                                    <tr key={r._id}>
                                      <td className="px-3 py-2 text-gray-400">{r.nombre}</td>
                                      <td className="px-3 py-2 text-gray-400">{r.cantidad} unidades</td>
                                    </tr>
                                  ))}

                                  {repuestosPorDeposito.length === 0 && (
                                    <tr>
                                      <td className="px-3 py-4 text-gray-400" colSpan={2}>
                                        No hay repuestos en este depósito.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {depositosFiltrados?.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-gray-400"
                    colSpan={6}
                  >
                    No hay depósitos que coincidan con la búsqueda.
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