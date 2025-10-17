// src/app/movimientos/nuevo/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Id } from "../../../../convex/_generated/dataModel";

export default function NuevoMovimientoPage() {
  const router = useRouter();

  const depositos = useQuery(api.depositos.listar) || [];
  const tiposComprobante = useQuery(api.tipos_comprobante.listar) || [];
  const tiposMovimiento = useQuery(api.tipos_movimiento.listar) || [];

  const [form, setForm] = useState({
    depositoOrigen: "",
    depositoDestino: "",
    tipoComprobanteId: "",
    tipoMovimiento: "ingreso" as "ingreso" | "egreso",
    esTraspaso: false,
    fecha: "",
    hora: "",
  });

  // Traer repuestos del depósito origen
  const repuestosEnDeposito =
    useQuery(
      api.movimientos.listarRepuestosEnDeposito,
      form.depositoOrigen
        ? { depositoId: form.depositoOrigen as Id<"depositos"> }
        : "skip"
    ) || [];

  // Mutations
  const crearMovimiento = useMutation(api.movimientos.crearMovimiento);
  const transferir = useMutation(api.movimientos.transferirEntreDepositos);
  const agregarDetalle = useMutation(api.movimientos.agregarDetalleMovimiento);

  // Estado para detalle de repuestos
  const [detalles, setDetalles] = useState<
    { repuestoId: string; cantidad: number }[]
  >([]);

  const [repuestoSeleccionado, setRepuestoSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState(0);

  const handleCantidadChange = (repuestoId: string, cantidad: number) => {
    setDetalles((prev) => {
      const existe = prev.find((d) => d.repuestoId === repuestoId);
      if (existe) {
        return prev.map((d) =>
          d.repuestoId === repuestoId ? { ...d, cantidad } : d
        );
      }
      return [...prev, { repuestoId, cantidad }];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.tipoComprobanteId || !form.depositoOrigen) {
      alert("Complete todos los campos obligatorios");
      return;
    }

    if (detalles.length === 0) {
      alert("Debe seleccionar al menos un repuesto con cantidad");
      return;
    }

    if (form.tipoMovimiento === "ingreso") {
      // === INGRESO simple ===
      const tipoMovId = getTipoMovimientoId("ingreso");
      if (!tipoMovId) {
        alert("No se encontró tipo de movimiento ingreso");
        return;
      }

      const id = await crearMovimiento({
        depositoId: form.depositoOrigen as Id<"depositos">,
        tipoComprobanteId: form.tipoComprobanteId as Id<"tipos_comprobante">,
        tipoMovimientoId: tipoMovId,
        fecha_registro: form.fecha,
        hora_registro: form.hora,
      });

      for (const d of detalles) {
        await agregarDetalle({
          movimientoId: id,
          repuestoDepositoId: d.repuestoId as Id<"repuestos_por_deposito">,
          cantidad: d.cantidad,
        });
      }

      router.push(`/movimientos/${id}`);
    } else {
      // === EGRESO ===
      if (form.esTraspaso) {
        if (!form.depositoDestino) {
          alert("Debe seleccionar depósito destino");
          return;
        }

        await transferir({
          depositoOrigenId: form.depositoOrigen as Id<"depositos">,
          depositoDestinoId: form.depositoDestino as Id<"depositos">,
          tipoComprobanteId: form.tipoComprobanteId as Id<"tipos_comprobante">,
          repuestos: detalles.map((d) => ({
            repuestoOrigenId: d.repuestoId as Id<"repuestos_por_deposito">,
            cantidad: d.cantidad,
          })),
          fecha: form.fecha,
          hora: form.hora,
        });

        router.push("/movimientos");
      } else {
        // Egreso simple
        const tipoMovId = getTipoMovimientoId("egreso");
        if (!tipoMovId) {
          alert("No se encontró tipo de movimiento egreso");
          return;
        }

        const id = await crearMovimiento({
          depositoId: form.depositoOrigen as Id<"depositos">,
          tipoComprobanteId: form.tipoComprobanteId as Id<"tipos_comprobante">,
          tipoMovimientoId: tipoMovId,
          fecha_registro: form.fecha,
          hora_registro: form.hora,
        });

        for (const d of detalles) {
          await agregarDetalle({
            movimientoId: id,
            repuestoDepositoId: d.repuestoId as Id<"repuestos_por_deposito">,
            cantidad: d.cantidad,
          });
        }

        router.push(`/movimientos/${id}`);
      }
    }
  };

  // 🔹 helper para traer el ID del tipo de movimiento según ingreso/egreso
  function getTipoMovimientoId(tipo: "ingreso" | "egreso") {
    const encontrado = tiposMovimiento.find(
      (x: any) => x.ingreso_egreso === tipo
    );
    return encontrado?._id;
  }

  return (
    <div className="min-h-screen bg-[#1b3a3f] text-[#e6f6f7] p-6 space-y-6">
      <h1 className="text-2xl font-bold">➕ Nuevo Movimiento</h1>

      {/* Card de encabezado */}
      <Card className="bg-[#24474d] border border-[#2f6368]">
        <CardContent className="p-4 space-y-4">
          {/* Tipo comprobante */}
          <div>
            <label className="block mb-2">Comprobante</label>
            <select
              className="border border-[#2c5a60] p-2 rounded w-full bg-[#24474d] text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
              value={form.tipoComprobanteId}
              onChange={(e) =>
                setForm({ ...form, tipoComprobanteId: e.target.value })
              }
            >
              <option value="">Seleccionar comprobante</option>
              {tiposComprobante.map((tc: any) => (
                <option key={tc._id} value={tc._id}>
                  {tc.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Depósito origen */}
          <div>
            <label className="block mb-2">Depósito Origen</label>
            <select
              className="border border-[#2c5a60] p-2 rounded w-full bg-[#24474d] text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
              value={form.depositoOrigen}
              onChange={(e) =>
                setForm({ ...form, depositoOrigen: e.target.value })
              }
            >
              <option value="">Seleccionar depósito</option>
              {depositos.map((d: any) => (
                <option key={d._id} value={d._id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo movimiento */}
          <div>
            <label className="block mb-2">Tipo Movimiento</label>
            <select
              className="border border-[#2c5a60] p-2 rounded w-full bg-[#24474d] text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
              value={form.tipoMovimiento}
              onChange={(e) =>
                setForm({
                  ...form,
                  tipoMovimiento: e.target.value as "ingreso" | "egreso",
                })
              }
            >
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </div>

          {/* Si es egreso, preguntar si es traspaso */}
          {form.tipoMovimiento === "egreso" && (
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.esTraspaso}
                  onChange={(e) =>
                    setForm({ ...form, esTraspaso: e.target.checked })
                  }
                />
                ¿Es traspaso a otro depósito?
              </label>
              {form.esTraspaso && (
                <select
                  className="border border-[#2c5a60] p-2 rounded w-full mt-2 bg-[#24474d] text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
                  value={form.depositoDestino}
                  onChange={(e) =>
                    setForm({ ...form, depositoDestino: e.target.value })
                  }
                >
                  <option value="">Seleccionar depósito destino</option>
                  {depositos
                    .filter((d: any) => d._id !== form.depositoOrigen)
                    .map((d: any) => (
                      <option key={d._id} value={d._id}>
                        {d.nombre}
                      </option>
                    ))}
                </select>
              )}
            </div>
          )}

          {/* Fecha y hora */}
          <Input
            type="date"
            className="bg-[#24474d] border border-[#2c5a60] text-gray-100"
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
          />
          <Input
            type="time"
            className="bg-[#24474d] border border-[#2c5a60] text-gray-100"
            value={form.hora}
            onChange={(e) => setForm({ ...form, hora: e.target.value })}
          />
        </CardContent>
      </Card>

      {/* Card de ítems */}
      {form.depositoOrigen && repuestosEnDeposito.length > 0 && (
        <Card className="bg-[#24474d] border border-[#2f6368] mt-6">
          <CardContent className="p-4 space-y-4">
            <h2 className="text-lg font-semibold text-white">
              ➕ Agregar Repuestos
            </h2>

            <div className="flex gap-2 items-center">
              <select
                className="border border-[#2c5a60] p-2 rounded flex-1 bg-[#24474d] text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
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
                className="border border-[#2c5a60] p-2 rounded w-24 bg-[#24474d] text-gray-100"
                placeholder="0"
                min="0"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
              />

              <Button
                className="bg-[#2ca6a4] hover:bg-[#249390] text-white"
                onClick={() => {
                  if (repuestoSeleccionado && cantidad > 0) {
                    handleCantidadChange(repuestoSeleccionado, cantidad);
                    setCantidad(0);
                    setRepuestoSeleccionado("");
                  }
                }}
              >
                ➕ Agregar Detalle
              </Button>
            </div>

            {/* Lista de detalles ya agregados */}
            {detalles.length > 0 && (
              <ul className="space-y-2 mt-4">
                {detalles.map((d) => {
                  const rep = repuestosEnDeposito.find(
                    (r: any) => r._id === d.repuestoId
                  );
                  return (
                    <li
                      key={d.repuestoId}
                      className="flex justify-between items-center border-b border-[#2f6368] pb-1"
                    >
                      <span>
                        {rep?.repuesto?.codigo} - {rep?.repuesto?.nombre}
                      </span>
                      <span className="text-green-400 font-semibold">
                        x{d.cantidad}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botón final */}
      <Button
        className="bg-[#2ca6a4] hover:bg-[#249390] text-white w-full"
        onClick={handleSubmit}
      >
        Guardar
      </Button>
    </div>
  );
}
