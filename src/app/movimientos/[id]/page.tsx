// src/app/movimientos/[id]/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
// Asumiendo que Card, CardContent y Button son importaciones locales de tu proyecto
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

  // Fondo principal: Usamos el color oscuro `#0b1618`
  if (!movimiento) return <div className="min-h-screen bg-[#0b1618] p-6 text-gray-100">Cargando...</div>;

  return (
    // Fondo principal: Usamos el color oscuro `#0b1618`
    <div className="min-h-screen bg-[#0b1618] p-6 space-y-6 text-gray-100">
      <h1 className="text-2xl font-bold">
        Movimiento #{String(movimiento._creationTime).slice(-6)}
      </h1>

      {/* Encabezado del movimiento */}
      {/* Contenedor principal: Usamos el color de caja/fondo secundario: `#11292e` */}
      <Card className="bg-[#11292e] border border-[#1e3c42] shadow-lg">
        <CardContent className="p-4 space-y-2 text-gray-300">
          <p>
            <b className="text-white">Depósito:</b> {movimiento.deposito?.nombre}
          </p>
          <p>
            <b className="text-white">Tipo:</b> {movimiento.tipoMovimiento?.nombre}
          </p>
          <p>
            <b className="text-white">Comprobante:</b> {movimiento.tipoComprobante?.nombre}
          </p>
          <p>
            <b className="text-white">Estado:</b>{" "}
            {movimiento.confirmado ? "✅ Confirmado" : "⏳ Pendiente"}
          </p>
        </CardContent>
      </Card>

      {/* Agregar detalles */}
      {!movimiento.confirmado && (
        // Contenedor secundario: Usamos un color ligeramente distinto para el formulario `#1a3035`
        <Card className="bg-[#1a3035] border border-[#1e3c42] shadow-lg">
          <CardContent className="p-4 space-y-3">
            <select
              // Estilo de select para fondo oscuro
              className="border border-[#1e3c42] p-2 rounded text-gray-900 w-full bg-white"
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
              // Estilo de input para fondo oscuro
              className="border border-[#1e3c42] p-2 rounded text-gray-900 w-full bg-white"
              placeholder="Cantidad"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
            />

            <Button
              // Botón de acción principal: Usamos el color de acento teal
              className="bg-[#36b6b0] hover:bg-[#2ca6a4] text-white w-full"
              onClick={async () => {
                if (repuestoSeleccionado && cantidad > 0) {
                  await agregarDetalle({
                    movimientoId,
                    repuestoDepositoId:
                      repuestoSeleccionado as Id<"repuestos_por_deposito">,
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

      {/* Lista de detalles en grilla */}
      {/* Contenedor principal: Usamos el color de caja/fondo secundario: `#11292e` */}
      <Card className="bg-[#11292e] border border-[#1e3c42] shadow-lg">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* Encabezado de la tabla */}
              <tr className="bg-[#1e3c42] text-gray-300">
                <th className="p-3 border-b border-[#1e3c42]">Código</th>
                <th className="p-3 border-b border-[#1e3c42]">Nombre</th>
                <th className="p-3 border-b border-[#1e3c42]">Cantidad</th>
                {!movimiento.confirmado && (
                  <th className="p-3 border-b border-[#1e3c42]">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {detalles.map((d: any) => (
                // Fila de la tabla con hover
                <tr key={d._id} className="hover:bg-[#1a3035]">
                  <td className="p-3 border-b border-[#1e3c42]">
                    {d.repuesto?.codigo}
                  </td>
                  <td className="p-3 border-b border-[#1e3c42] text-gray-300">
                    {d.repuesto?.nombre}
                  </td>
                  <td className="p-3 border-b border-[#1e3c42] text-white font-medium">{d.cantidad}</td>
                  {!movimiento.confirmado && (
                    <td className="p-3 border-b border-[#1e3c42]">
                      <Button
                        // Botón de eliminar
                        className="bg-red-700 hover:bg-red-600 text-white"
                        onClick={() => eliminarDetalle({ detalleId: d._id })}
                      >
                        🗑️ Eliminar
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
              {detalles.length === 0 && (
                <tr>
                  <td
                    colSpan={movimiento.confirmado ? 3 : 4}
                    className="p-4 text-center text-gray-400"
                  >
                    No hay detalles cargados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Confirmar */}
      {!movimiento.confirmado && (
        <Button
          // Botón de confirmación
          className="bg-green-700 hover:bg-green-600 text-white"
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