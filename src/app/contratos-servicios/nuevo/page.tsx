"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function NuevoContratoServicioPage() {
  const router = useRouter();
  const crear = useMutation(api.contratos_servicios.crear);
  const clientes = useQuery(api.clientes_ventas.listar, {}) ?? [];

  // 🧱 Estados del formulario
  const [clienteId, setClienteId] = useState<Id<"clientes_ventas"> | "">("");
  const [tipo, setTipo] = useState("");
  const [tarifaBase, setTarifaBase] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [estado, setEstado] = useState("VIGENTE");
  const [notas, setNotas] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🧭 Opciones de tipo de servicio (puedes ampliarlas)
  const tiposServicio = [
    "Transporte de carga",
    "Traslado de personal",
    "Logística minera",
    "Alquiler de maquinaria",
    "Mantenimiento y soporte",
    "Gestión de residuos",
  ];

  // 🧩 Validar y enviar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteId || !tipo || !tarifaBase || !fechaInicio) {
      setError("Por favor, completa todos los campos obligatorios.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await crear({
        clienteId: clienteId as Id<"clientes_ventas">,
        tipo: tipo.trim(),
        tarifaBase: parseFloat(tarifaBase),
        fechaInicio,
        fechaFin: fechaFin || undefined,
        estado,
        notas: notas.trim() || undefined,
      });

      router.push("/contratos-servicios");
    } catch (err: any) {
      setError(err.message || "Error al guardar el contrato.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1b3a3f] p-8 text-[#e8f9f9]">
      <div className="max-w-3xl mx-auto bg-[#24474d] rounded-xl border border-[#2f6368] shadow-lg p-8 space-y-6">
        {/* 🔹 Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Nuevo Contrato de Servicio</h1>
          <Link
            href="/contratos-servicios"
            className="flex items-center gap-2 text-[#36b6b0] hover:text-[#2ca6a4]"
          >
            <ArrowLeft size={18} /> Volver
          </Link>
        </div>

        {/* 🔹 Mensaje de error */}
        {error && (
          <div className="bg-red-800/30 text-red-300 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 🔹 Formulario */}
        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Cliente */}
          <div>
            <label className="text-sm mb-1 block">Cliente *</label>
            <select
              value={clienteId}
              onChange={(e) =>
                setClienteId(e.target.value as Id<"clientes_ventas">)
              }
              required
              className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f] text-[#e8f9f9] focus:ring-2 focus:ring-[#36b6b0]"
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.alias && c.alias.trim() !== ""
                    ? `${c.alias} (${c.razonSocial})`
                    : c.razonSocial}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo y tarifa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm mb-1 block">Tipo de servicio *</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f] text-[#e8f9f9] focus:ring-2 focus:ring-[#36b6b0]"
              >
                <option value="">Seleccionar tipo</option>
                {tiposServicio.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm mb-1 block">Tarifa base (ARS) *</label>
              <input
                type="number"
                step="0.01"
                value={tarifaBase}
                onChange={(e) => setTarifaBase(e.target.value)}
                placeholder="Monto en pesos"
                className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f] text-[#e8f9f9] focus:ring-2 focus:ring-[#36b6b0]"
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm mb-1 block">Fecha de inicio *</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f] text-[#e8f9f9] focus:ring-2 focus:ring-[#36b6b0]"
              />
            </div>
            <div>
              <label className="text-sm mb-1 block">Fecha de finalización</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f] text-[#e8f9f9] focus:ring-2 focus:ring-[#36b6b0]"
              />
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="text-sm mb-1 block">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f] text-[#e8f9f9] focus:ring-2 focus:ring-[#36b6b0]"
            >
              <option value="VIGENTE">VIGENTE</option>
              <option value="FINALIZADO">FINALIZADO</option>
              <option value="PENDIENTE">PENDIENTE</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="text-sm mb-1 block">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              placeholder="Detalles adicionales del contrato..."
              className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f] text-[#e8f9f9] focus:ring-2 focus:ring-[#36b6b0]"
            />
          </div>

          {/* Botón guardar */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-semibold transition disabled:opacity-60"
          >
            <Save size={18} />
            {loading ? "Guardando..." : "Guardar contrato"}
          </button>
        </form>
      </div>
    </div>
  );
}
