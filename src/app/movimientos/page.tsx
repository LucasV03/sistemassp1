// src/app/movimientos/page.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function MovimientosPage() {
  const router = useRouter();

  const depositos = useQuery(api.depositos.listar) || [];
  const tiposMovimiento = useQuery(api.tipos_movimiento.listar) || [];
  const todosMovimientos = useQuery(api.movimientos.listarTodos) || [];

  const [filtros, setFiltros] = useState({
    depositoId: "",
    tipoMovimientoId: "",
    estado: "",
  });

  // Barra de búsqueda
  const [q, setQ] = useState("");

  // Normalizador para búsqueda (casefold + sin tildes)
  const normalize = (v: unknown) =>
    (v ?? "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      // @ts-ignore: unicode regex for diacritics
      .replace(/\p{Diacritic}/gu, "");

  const movimientosFiltrados = useMemo(() => {
    const porSelects = todosMovimientos.filter((m: any) => {
      return (
        (filtros.depositoId ? m.depositoId === filtros.depositoId : true) &&
        (filtros.tipoMovimientoId
          ? m.tipoMovimientoId === filtros.tipoMovimientoId
          : true) &&
        (filtros.estado
          ? filtros.estado === "confirmado"
            ? m.confirmado
            : !m.confirmado
          : true)
      );
    });

    if (!q) return porSelects;

    const nq = normalize(q);
    return porSelects.filter((m: any) => {
      const comprobante = normalize(m.tipoComprobante?.nombre);
      const movimiento = normalize(m.tipoMovimiento?.nombre);
      const depositoNom = normalize(m.deposito?.nombre);
      const fecha = normalize(m.fecha_registro);
      const hora = normalize(m.hora_registro);
      return (
        comprobante.includes(nq) ||
        movimiento.includes(nq) ||
        depositoNom.includes(nq) ||
        `${fecha} ${hora}`.includes(nq)
      );
    });
  }, [todosMovimientos, filtros, q]);

  const clearSearch = () => setQ("");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl text-white font-bold">📦 Movimientos</h1>
        <button
          className="inline-flex items-center justify-center rounded-lg bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-600 transition"
          onClick={() => router.push("/movimientos/nuevo")}
        >
          ➕ Nuevo Movimiento
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
        {/* Selectores */}
        <div className="grid md:grid-cols-3 gap-3 text-zinc-200">
          <select
            className="border border-zinc-700 bg-zinc-950 p-2 rounded-lg"
            value={filtros.depositoId}
            onChange={(e) =>
              setFiltros({ ...filtros, depositoId: e.target.value })
            }
          >
            <option value="">Todos los depósitos</option>
            {depositos.map((d: any) => (
              <option key={d._id} value={d._id}>
                {d.nombre}
              </option>
            ))}
          </select>

          <select
            className="border border-zinc-700 bg-zinc-950 p-2 rounded-lg"
            value={filtros.tipoMovimientoId}
            onChange={(e) =>
              setFiltros({ ...filtros, tipoMovimientoId: e.target.value })
            }
          >
            <option value="">Todos los movimientos</option>
            {tiposMovimiento.map((tm: any) => (
              <option key={tm._id} value={tm._id}>
                {tm.nombre} ({tm.ingreso_egreso})
              </option>
            ))}
          </select>

          <select
            className="border border-zinc-700 bg-zinc-950 p-2 rounded-lg"
            value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
          >
            <option value="">Todos los estados</option>
            <option value="confirmado">Confirmados</option>
            <option value="pendiente">Pendientes</option>
          </select>
        </div>

        {/* Buscador */}
        <div className="relative">
          <label htmlFor="buscarMovimientos" className="sr-only">
            Buscar movimientos
          </label>
          <input
            id="buscarMovimientos"
            type="text"
            placeholder="Buscar por comprobante, movimiento, depósito, fecha u hora…"
            className="w-full bg-zinc-950 text-white placeholder-zinc-500 border border-zinc-700 rounded-lg pl-10 pr-9 py-2 outline-none focus:ring-2 focus:ring-indigo-600"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span
            aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          >
            🔎
          </span>
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

      {/* Tabla */}
      <div className="bg-zinc-900 rounded-xl p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-zinc-800 text-zinc-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Comprobante</th>
                <th className="px-4 py-3 font-semibold">Movimiento</th>
                <th className="px-4 py-3 font-semibold">Depósito</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {movimientosFiltrados.map((m: any) => (
                <tr key={m._id} className="hover:bg-zinc-800/60 transition">
                  <td className="px-4 py-3 text-zinc-100">
                    {m.tipoComprobante?.nombre ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {m.tipoMovimiento?.nombre ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {m.deposito?.nombre ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                    {m.fecha_registro} {m.hora_registro}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
                        (m.confirmado
                          ? "bg-green-500/15 text-green-400 ring-1 ring-green-500/30"
                          : "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30")
                      }
                    >
                      {m.confirmado ? "Confirmado" : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        className="rounded-lg bg-indigo-700 px-3 py-1.5 text-white hover:bg-indigo-600 transition"
                        onClick={() => router.push(`/movimientos/${m._id}`)}
                      >
                        Abrir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {movimientosFiltrados.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-zinc-400"
                    colSpan={6}
                  >
                    No hay resultados con los filtros y la búsqueda actual.
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
