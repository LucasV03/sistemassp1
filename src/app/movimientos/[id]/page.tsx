// src/app/movimientos/[id]/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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

  // Estado local para agregar ítems
  const [repuestoDepositoId, setRepuestoDepositoId] = useState<
    Id<"repuestos_por_deposito"> | ""
  >("");
  const [cantidad, setCantidad] = useState<number>(1);

  const puedeAgregar = useMemo(() => {
    return !!repuestoDepositoId && cantidad > 0 && !!movimiento && !movimiento.confirmado;
  }, [repuestoDepositoId, cantidad, movimiento]);

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeAgregar) return;

    await agregarDetalle({
      movimientoId,
      repuestoDepositoId: repuestoDepositoId as Id<"repuestos_por_deposito">,
      cantidad,
    });

    setCantidad(1);
    setRepuestoDepositoId("");
  };

  const handleEliminar = async (detalleId: Id<"detalle_movimiento">) => {
    await eliminarDetalle({ detalleId });
  };

  const handleConfirmar = async () => {
    try {
      await confirmarMovimiento({ movimientoId });
      alert("Movimiento confirmado y stock actualizado.");
      router.push("/movimientos");
    } catch (e: any) {
      alert(e?.message ?? "Error al confirmar.");
    }
  };

  if (!movimiento) return <div className="p-6">Cargando...</div>;

  const deshabilitado = movimiento.confirmado;

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Movimiento #{String(movimiento._creationTime).slice(-6)}</h1>
        <Button className="bg-indigo-700 border-hidden text-white" variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      <Card className="bg-zinc-800">
        <CardContent className="p-4 grid gap-2 ">
          <div className=" text-sm">
            <span className="font-semibold">Depósito:</span>{" "}
            {movimiento.deposito?.nombre} ({movimiento.deposito?.ciudad})
          </div>
          <div className="text-sm">
            <span className="font-semibold">Tipo comprobante:</span>{" "}
            {movimiento.tipoComprobante?.nombre}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Movimiento:</span>{" "}
            {movimiento.tipoMovimiento?.nombre} (
            {movimiento.tipoMovimiento?.ingreso_egreso})
          </div>
          <div className="text-sm">
            <span className="font-semibold">Fecha/Hora:</span>{" "}
            {movimiento.fecha_registro} {movimiento.hora_registro}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Estado:</span>{" "}
            {movimiento.confirmado ? "✅ Confirmado" : "⏳ Pendiente"}
          </div>
        </CardContent>
      </Card>

      {/* Agregar ítems */}
      <Card className="bg-zinc-800">
        <CardContent className="p-4 text-zinc-400">
          <form onSubmit={handleAgregar} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col min-w-[280px]">
              <label className="text-sm mb-1">Repuesto del depósito</label>
              <select
                disabled={deshabilitado}
                className="border rounded px-3 py-2"
                value={repuestoDepositoId}
                onChange={(e) =>
                  setRepuestoDepositoId(e.target.value as Id<"repuestos_por_deposito">)
                }
              >
                <option value="">-- Seleccione --</option>
                {repuestosEnDeposito.map((rd: any) => (
                  <option key={rd._id} value={rd._id}>
                    {rd.repuesto?.codigo} - {rd.repuesto?.nombre} | Stock: {rd.stock_actual ?? 0}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col w-40">
              <label className="text-sm mb-1">Cantidad</label>
              <input
                disabled={deshabilitado}
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="border rounded px-3 py-2"
              />
            </div>

            <Button className="bg-indigo-700 text-white" type="submit" disabled={!puedeAgregar}>
              Agregar ítem
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de ítems */}
      <Card className="bg-zinc-800">
        <CardContent className="p-4 text-zinc-400">
          {detalles.length === 0 ? (
            <p className="text-sm text-red-500">Sin ítems cargados.</p>
          ) : (
            <div className="grid gap-2">
              {detalles.map((d: any) => (
                <div
                  key={d._id}
                  className="flex items-center justify-between border rounded p-2"
                >
                  <div className="text-sm">
                    <div className="font-medium">
                      {d.repuesto?.codigo} - {d.repuesto?.nombre}
                    </div>
                    <div className="opacity-75">
                      Cantidad: {d.cantidad} | Stock actual en depósito:{" "}
                      {d.repuestoDeposito?.stock_actual ?? 0}
                    </div>
                  </div>
                  {!deshabilitado && (
                    <Button
                      className="bg-indigo-700"
                      variant="destructive"
                      onClick={() => handleEliminar(d._id)}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3 bg-indigo-700 text-white rounded w-100 ml-144">
        {!deshabilitado && (
          <Button onClick={handleConfirmar} disabled={detalles.length === 0}>
            Confirmar movimiento
          </Button>
        )}
      </div>
    </main>
  );
}
