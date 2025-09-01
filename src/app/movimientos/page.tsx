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

  const movimientos =
    useQuery(
      api.movimientos.listarMovimientosPorDeposito,
      depositoSeleccionado ? { depositoId: depositoSeleccionado } : "skip"
    ) || [];

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

    // Ir directo al detalle para cargar ítems
    router.push(`/movimientos/${nuevoId}`);

    setForm({
      tipoComprobanteId: "",
      tipoMovimientoId: "",
      fecha_registro: "",
      hora_registro: "",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Movimientos</h1>

      <Card>
        <CardContent className="p-4">
          <label className="block mb-2 font-semibold">
            Seleccione un depósito
          </label>
          <select
            className="border p-2 rounded w-full"
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
        <Card>
          <CardContent className="p-4">
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

              <Button type="submit">Crear Encabezado</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {depositoSeleccionado && (
        <div className="grid gap-4">
          {movimientos.map((m: any) => (
            <Card key={m._id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">
                    {m.tipoComprobante?.nombre} - {m.tipoMovimiento?.nombre}
                  </p>
                  <p className="text-sm text-gray-600">
                    Fecha: {m.fecha_registro} {m.hora_registro}
                  </p>
                  <p className="text-sm">
                    Estado: {m.confirmado ? "✅ Confirmado" : "⏳ Pendiente"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/movimientos/${m._id}`)}
                  >
                    Abrir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
