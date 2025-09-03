// src/app/movimientos/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Id } from "../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";

export default function MovimientosPage() {
  const router = useRouter();

  const depositos = useQuery(api.depositos.listar) || [];
  const tiposComprobante = useQuery(api.tipos_comprobantes.listar) || [];
  const tiposMovimiento = useQuery(api.tipos_movimiento.listar) || [];

  const [depositoSeleccionado, setDepositoSeleccionado] = useState<
    Id<"depositos"> | ""
  >("");

  // Movimientos filtrados por depósito (parte superior)
  const movimientos =
    useQuery(
      api.movimientos.listarMovimientosPorDeposito,
      depositoSeleccionado ? { depositoId: depositoSeleccionado } : "skip"
    ) || [];

  // Movimientos globales
  const todosMovimientos = useQuery(api.movimientos.listarTodos) || [];

  const crearMovimiento = useMutation(api.movimientos.crearMovimiento);

  // Form de encabezado
  const [form, setForm] = useState<{
    tipoComprobanteId: Id<"tipos_comprobante"> | "";
    tipoMovimientoId: Id<"tipos_movimiento"> | "";
    fecha_registro: string;
    hora_registro: string;
  }>({
    tipoComprobanteId: "",
    tipoMovimientoId: "",
    fecha_registro: "",
    hora_registro: "",
  });

  // Filtros globales
  const [filtros, setFiltros] = useState({
    depositoId: "",
    tipoComprobanteId: "",
    tipoMovimientoId: "",
    estado: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositoSeleccionado) {
      alert("Seleccione un depósito primero");
      return;
    }

    const nuevoId = await crearMovimiento({
      depositoId: depositoSeleccionado,
      tipoComprobanteId: form.tipoComprobanteId as Id<"tipos_comprobante">,
      tipoMovimientoId: form.tipoMovimientoId as Id<"tipos_movimiento">,
      fecha_registro: form.fecha_registro,
      hora_registro: form.hora_registro,
    });

    router.push(`/movimientos/${nuevoId}`);

    setForm({
      tipoComprobanteId: "",
      tipoMovimientoId: "",
      fecha_registro: "",
      hora_registro: "",
    });
  };

  // Aplicar filtros
  const movimientosFiltrados = todosMovimientos.filter((m: any) => {
    return (
      (filtros.depositoId ? m.depositoId === filtros.depositoId : true) &&
      (filtros.tipoComprobanteId
        ? m.tipoComprobanteId === filtros.tipoComprobanteId
        : true) &&
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl text-white font-bold">Gestión de Movimientos</h1>

      {/* Selección de depósito y creación */}
      <Card className="bg-zinc-800">
        <CardContent className="p-4">
          <label className="block mb-2 font-semibold text-zinc-400">
            Seleccione un depósito
          </label>
          <select
            className="border p-2 rounded w-full text-zinc-500"
            value={depositoSeleccionado}
            onChange={(e) =>
              setDepositoSeleccionado(e.target.value as Id<"depositos"> | "")
            }
          >
            <option value="">-- Seleccionar --</option>
            {depositos.map((d: any) => (
              <option key={d._id} value={d._id}>
                {d.nombre} - {d.ciudad}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {depositoSeleccionado && (
        <Card className="bg-zinc-800">
          <CardContent className="p-4 text-zinc-500">
            <form onSubmit={handleSubmit} className="grid gap-3">
              <select
                className="border p-2 rounded"
                value={form.tipoComprobanteId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tipoComprobanteId: e.target.value as Id<"tipos_comprobante">,
                  })
                }
                required
              >
                <option value="">Seleccionar comprobante</option>
                {tiposComprobante.map((tc: any) => (
                  <option key={tc._id} value={tc._id}>
                    {tc.nombre}
                  </option>
                ))}
              </select>

              <select
                className="border p-2 rounded"
                value={form.tipoMovimientoId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tipoMovimientoId: e.target.value as Id<"tipos_movimiento">,
                  })
                }
                required
              >
                <option value="">Seleccionar movimiento</option>
                {tiposMovimiento.map((tm: any) => (
                  <option key={tm._id} value={tm._id}>
                    {tm.nombre} ({tm.ingreso_egreso})
                  </option>
                ))}
              </select>

              <Input
                type="date"
                value={form.fecha_registro}
                onChange={(e) =>
                  setForm({ ...form, fecha_registro: e.target.value })
                }
                required
              />
              <Input
                type="time"
                value={form.hora_registro}
                onChange={(e) =>
                  setForm({ ...form, hora_registro: e.target.value })
                }
                required
              />

              <Button
                className="bg-indigo-700 text-white"
                type="submit"
              >
                Crear Encabezado
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Movimientos del depósito */}
      {depositoSeleccionado && (
        <div className="grid gap-4">
          {movimientos.map((m: any) => (
            <Card key={m._id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-white">
                    {m.tipoComprobante?.nombre} - {m.tipoMovimiento?.nombre}
                  </p>
                  <p className="text-sm text-zinc-500">
                    Fecha: {m.fecha_registro} {m.hora_registro}
                  </p>
                  <p className="text-sm text-zinc-500">
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
      )}

      {/* --- Movimientos globales con filtros --- */}
      <h2 className="text-xl font-bold text-white mt-8">
        Todos los movimientos
      </h2>

      <Card className="bg-zinc-900">
        <CardContent className="p-4 space-y-3 text-zinc-400">
          <div className="grid md:grid-cols-4 gap-2">
            <select
              className="border p-2 rounded"
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
              className="border p-2 rounded"
              value={filtros.tipoComprobanteId}
              onChange={(e) =>
                setFiltros({ ...filtros, tipoComprobanteId: e.target.value })
              }
            >
              <option value="">Todos los comprobantes</option>
              {tiposComprobante.map((tc: any) => (
                <option key={tc._id} value={tc._id}>
                  {tc.nombre}
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
                  {tm.nombre}
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
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 mt-4">
        {movimientosFiltrados.map((m: any) => (
          <Card key={m._id} className="bg-zinc-800">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-white">
                  {m.tipoComprobante?.nombre} - {m.tipoMovimiento?.nombre}
                </p>
                <p className="text-sm text-zinc-500">
                  Depósito: {m.deposito?.nombre}
                </p>
                <p className="text-sm text-zinc-500">
                  Fecha: {m.fecha_registro} {m.hora_registro}
                </p>
                <p className="text-sm text-zinc-500">
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
