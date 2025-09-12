// src/app/movimientos/page.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  // Filtrado en memoria
  const movimientosFiltrados = useMemo(() => {
    return todosMovimientos.filter((m: any) => {
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
  }, [todosMovimientos, filtros]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl text-white font-bold">📦 Movimientos</h1>
        <Button
          className="bg-indigo-700 text-white"
          onClick={() => router.push("/movimientos/nuevo")}
        >
          ➕ Nuevo Movimiento
        </Button>
      </div>

      {/* Filtros */}
      <Card className="bg-zinc-900">
        <CardContent className="p-4 grid md:grid-cols-3 gap-3 text-zinc-400">
          <select
            className="border p-2 rounded"
            value={filtros.depositoId}
            onChange={(e) => setFiltros({ ...filtros, depositoId: e.target.value })}
          >
            <option value="">Todos los depósitos</option>
            {depositos.map((d: any) => (
              <option key={d._id} value={d._id}>
                {d.nombre}
              </option>
            ))}
          </select>

          <select
            className="border p-2 rounded"
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
            className="border p-2 rounded"
            value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
          >
            <option value="">Todos los estados</option>
            <option value="confirmado">Confirmados</option>
            <option value="pendiente">Pendientes</option>
          </select>
        </CardContent>
      </Card>

      {/* Lista */}
      <div className="grid gap-4">
        {movimientosFiltrados.map((m: any) => (
          <Card key={m._id} className="bg-zinc-800">
            <CardContent className="flex justify-between items-center p-4">
              <div>
                <p className="font-semibold text-white">
                  {m.tipoComprobante?.nombre} - {m.tipoMovimiento?.nombre}
                </p>
                <p className="text-sm text-zinc-400">
                  Depósito: {m.deposito?.nombre}
                </p>
                <p className="text-sm text-zinc-400">
                  Fecha: {m.fecha_registro} {m.hora_registro}
                </p>
                <p className="text-sm text-zinc-400">
                  Estado: {m.confirmado ? "✅ Confirmado" : "⏳ Pendiente"}
                </p>
              </div>
              <Button
                className="bg-indigo-700 text-white"
                onClick={() => router.push(`/movimientos/${m._id}`)}
              >
                Abrir
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
