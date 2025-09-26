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
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-white">Gestión de Depósitos</h1>
        <Link
          href="/depositos/nuevo"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-600 transition"
        >
          Nuevo depósito
        </Link>
      </div>

      {/* CONTROLES: STATS + SELECT + BUSCADOR */}
      {stats && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-800 rounded-xl p-4 text-white">
              <p className="text-sm text-zinc-300">Capacidad total</p>
              <p className="text-2xl font-bold">{stats.capacidadTotal}</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4 text-white">
              <p className="text-sm text-zinc-300">Ocupado</p>
              <p className="text-2xl font-bold">{stats.ocupado}</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4 text-white">
              <p className="text-sm text-zinc-300">% Ocupado</p>
              <p className="text-2xl font-bold">{stats.porcentaje}%</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4 text-white">
              <p className="text-sm text-zinc-300"># Depósitos</p>
              <p className="text-2xl font-bold">{stats.cantidadDepositos}</p>
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
                className="w-[260px] bg-zinc-900 text-white border border-zinc-700 rounded-lg px-3 py-2"
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
                className="w-full bg-zinc-900 text-white placeholder-zinc-500 border border-zinc-700 rounded-lg pl-10 pr-9 py-2 outline-none focus:ring-2 focus:ring-indigo-600"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {/* Icono lupa (decorativo, sin dependencias) */}
              <span
                aria-hidden
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              >
                🔎
              </span>
              {/* Botón clear */}
              {q && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
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
      <div className="bg-zinc-900 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-zinc-800 text-zinc-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Ubicación</th>
                <th className="px-4 py-3 font-semibold">Dirección</th>
                <th className="px-4 py-3 font-semibold">CP</th>
                <th className="px-4 py-3 font-semibold">Capacidad</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {depositosFiltrados?.map((d: any) => {
                const isExpanded = selectedDeposito === d._id;
                return (
                  <React.Fragment key={d._id}>
                    <tr className="hover:bg-zinc-800/60 transition">
                      <td className="px-4 py-3 text-zinc-100">{d.nombre}</td>
                      <td className="px-4 py-3 text-zinc-300">
                        {d.provincia} - {d.ciudad}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{d.calle}</td>
                      <td className="px-4 py-3 text-zinc-300">
                        {d.codigoPostal}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        {d.capacidad_total ?? "Sin límite"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/depositos/${d._id}`}
                            className="rounded-lg bg-sky-600 px-3 py-1.5 text-white hover:bg-sky-500 transition"
                          >
                            Ver
                          </Link>
                          <Link
                            href={`/depositos/${d._id}/editar`}
                            className="rounded-lg bg-indigo-700 px-3 py-1.5 text-white hover:bg-indigo-600 transition"
                          >
                            Editar
                          </Link>
                          <button
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-500 transition"
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
                        <td colSpan={6} className="bg-zinc-950 px-4 py-4">
                          <div className="text-white">
                            <h2 className="text-base font-semibold mb-3">
                              Repuestos en este depósito
                            </h2>

                            <div className="overflow-x-auto rounded-lg ring-1 ring-zinc-800">
                              <table className="min-w-full text-sm">
                                <thead className="bg-zinc-900 text-zinc-300">
                                  <tr>
                                    <th className="px-3 py-2 font-medium text-left">
                                      Repuesto
                                    </th>
                                    <th className="px-3 py-2 font-medium text-left">
                                      Cantidad
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                  {repuestosPorDeposito.map((r: any) => (
                                    <tr key={r._id}>
                                      <td className="px-3 py-2">{r.nombre}</td>
                                      <td className="px-3 py-2">
                                        {r.cantidad} unidades
                                      </td>
                                    </tr>
                                  ))}

                                  {repuestosPorDeposito.length === 0 && (
                                    <tr>
                                      <td
                                        className="px-3 py-4 text-zinc-400"
                                        colSpan={2}
                                      >
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
                    className="px-4 py-6 text-center text-zinc-400"
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
