// src/app/movimientos/[id]/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MovimientoDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const movimientoId = params.id as Id<"movimientos_stock">;

  const movimiento = useQuery(api.movimientos.obtenerMovimiento, {
    movimientoId,
  });

  const detalles =
    useQuery(api.movimientos.listarDetallesDeMovimiento, {
      movimientoId,
    }) || [];

  const repuestosEnDeposito =
    useQuery(
      api.movimientos.listarRepuestosEnDeposito,
      movimiento ? { depositoId: movimiento.depositoId } : "skip"
    ) || [];

  const agregarDetalle = useMutation(api.movimientos.agregarDetalleMovimiento);
  const eliminarDetalle = useMutation(api.movimientos.eliminarDetalleMovimiento);
  const confirmarMovimiento = useMutation(api.movimientos.confirmarMovimiento);

  const [repuestoSeleccionado, setRepuestoSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState(0);

  if (!movimiento) return <div className="p-6 text-white">Cargando...</div>;

  return (
    <div className="p-6 space-y-6 text-white">
      <h1 className="text-2xl font-bold">
        Movimiento #{String(movimiento._creationTime).slice(-6)}
      </h1>

      <Card className="bg-zinc-900">
        <CardContent className="p-4 space-y-2 text-zinc-300">
          <p>
            <b>Depósito:</b> {movimiento.deposito?.nombre}
          </p>
          <p>
            <b>Tipo:</b> {movimiento.tipoMovimiento?.nombre}
          </p>
          <p>
            <b>Comprobante:</b> {movimiento.tipoComprobante?.nombre}
          </p>
          <p>
            <b>Estado:</b>{" "}
            {movimiento.confirmado ? "✅ Confirmado" : "⏳ Pendiente"}
          </p>
        </CardContent>
      </Card>

      {/* Agregar detalles */}
      {!movimiento.confirmado && (
        <Card className="bg-zinc-800">
          <CardContent className="p-4 space-y-3">
            <select
              className="border p-2 rounded text-black"
              value={repuestoSeleccionado}
              onChange={(e) => setRepuestoSeleccionado(e.target.value)}
            >
              <option value="">-- Seleccionar repuesto --</option>
              {repuestosEnDeposito.map((r: any) => (
                <option key={r._id} value={r._id}>
                  {r.repuesto?.codigo} - {r.repuesto?.nombre} (Stock:{" "}
                  {r.stock_actual})
                </option>
              ))}
            </select>

            <input
              type="number"
              className="border p-2 rounded text-black"
              placeholder="Cantidad"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
            />

            <Button
              className="bg-indigo-700 text-white"
              onClick={async () => {
                if (repuestoSeleccionado && cantidad > 0) {
                  await agregarDetalle({
                    movimientoId,
                    repuestoDepositoId: repuestoSeleccionado as Id<"repuestos_por_deposito">,
                    cantidad,
                  });
                  setCantidad(0);
                  setRepuestoSeleccionado("");
                }
              }}
            >
              ➕ Agregar Detalle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de detalles */}
      <div className="space-y-3">
        {detalles.map((d: any) => (
          <Card key={d._id} className="bg-zinc-900">
            <CardContent className="flex justify-between p-3">
              <div>
                <p>
                  {d.repuesto?.codigo} - {d.repuesto?.nombre}
                </p>
                <p className="text-sm text-zinc-400">Cantidad: {d.cantidad}</p>
              </div>
              {!movimiento.confirmado && (
                <Button
                  className="bg-red-700 text-white"
                  onClick={() => eliminarDetalle({ detalleId: d._id })}
                >
                  🗑️ Eliminar
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confirmar */}
      {!movimiento.confirmado && (
        <Button
          className="bg-green-700 text-white"
          onClick={async () => {
            await confirmarMovimiento({ movimientoId });
            router.push("/movimientos");
          }}
        >
          ✅ Confirmar Movimiento
        </Button>
      )}
    </div>
  );
}
