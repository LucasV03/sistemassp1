"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import type { Id } from "../../../../convex/_generated/dataModel";

/* =========================================================
   🗺️ Tabla local de distancias predefinidas (puede pasarse a BD luego)
   ========================================================= */
const DISTANCIAS_PREDEFINIDAS: Record<string, Record<string, number>> = {
  "Base Central": { "Mina Sur": 120, "Mina Norte": 95, "Taller": 30 },
  "Mina Sur": { "Base Central": 120, "Taller": 150 },
  "Mina Norte": { "Base Central": 95, "Taller": 110 },
  "Taller": { "Base Central": 30, "Mina Sur": 150, "Mina Norte": 110 },
};

/* =========================================================
   🚛 NUEVO VIAJE PAGE
   ========================================================= */
export default function NuevoViajePage() {
  const router = useRouter();
  const crear = useMutation(api.viajes.crear);

  // Datos
  const clientes = useQuery(api.clientes_ventas.listar, {}) ?? [];
  const choferes = useQuery(api.choferes.listar, {}) ?? [];
  const vehiculos = useQuery(api.vehiculos.listar, {}) ?? [];

  // Estado local
  const [clienteId, setClienteId] = useState<Id<"clientes_ventas"> | "">("");
  const [choferId, setChoferId] = useState<Id<"choferes"> | "">("");
  const [vehiculoId, setVehiculoId] = useState<Id<"vehiculos"> | "">("");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [distanciaKm, setDistanciaKm] = useState("");
  const [estado, setEstado] = useState<
    "PENDIENTE" | "EN_CURSO" | "FINALIZADO" | "CANCELADO"
  >("PENDIENTE");
  const [error, setError] = useState("");

  /* =========================================================
     🧮 Autocalcular distancia cuando cambian origen/destino
     ========================================================= */
  useEffect(() => {
    if (origen && destino) {
      const distancia =
        DISTANCIAS_PREDEFINIDAS[origen]?.[destino] ??
        DISTANCIAS_PREDEFINIDAS[destino]?.[origen] ??
        0;
      setDistanciaKm(distancia ? String(distancia) : "");
    }
  }, [origen, destino]);

  /* =========================================================
     🧾 Enviar formulario
     ========================================================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !choferId || !vehiculoId || !origen || !destino || !distanciaKm) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    try {
      await crear({
        clienteId: clienteId as Id<"clientes_ventas">,
        choferId: choferId as Id<"choferes">,
        vehiculoId: vehiculoId as Id<"vehiculos">,
        origen,
        destino,
        distanciaKm: parseFloat(distanciaKm),
        estado,
      });
      router.push("/viajes");
    } catch (err: any) {
      setError(err.message || "Error al guardar el viaje.");
    }
  };

  /* =========================================================
     💄 Render
     ========================================================= */
  return (
    <div className="min-h-screen bg-[#0d1b1e] p-8 text-[#e8f9f9]">
      <div className="max-w-3xl mx-auto bg-[#11292e] rounded-2xl border border-[#1e3c42] shadow-lg p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Nuevo Viaje</h1>
          <Link
            href="/viajes"
            className="flex items-center gap-2 text-[#36b6b0] hover:text-[#2ca6a4]"
          >
            <ArrowLeft size={18} /> Volver
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-800/30 text-red-300 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* CLIENTE */}
          <div>
            <label className="text-sm mb-1 block text-[#93c6c1]">Cliente *</label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value as Id<"clientes_ventas">)}
              className="w-full px-4 py-2 rounded-lg border border-[#23454e] bg-[#132f34] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.alias || c.razonSocial}
                </option>
              ))}
            </select>
          </div>

          {/* CHOFER */}
          <div>
            <label className="text-sm mb-1 block text-[#93c6c1]">Chofer *</label>
            <select
              value={choferId}
              onChange={(e) => setChoferId(e.target.value as Id<"choferes">)}
              className="w-full px-4 py-2 rounded-lg border border-[#23454e] bg-[#132f34] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
            >
              <option value="">Seleccionar chofer</option>
              {choferes.map((ch: any) => (
                <option key={ch._id} value={ch._id}>
                  {ch.nombre} {ch.apellido}
                </option>
              ))}
            </select>
          </div>

          {/* VEHÍCULO */}
          <div>
            <label className="text-sm mb-1 block text-[#93c6c1]">Vehículo *</label>
            <select
              value={vehiculoId}
              onChange={(e) => setVehiculoId(e.target.value as Id<"vehiculos">)}
              className="w-full px-4 py-2 rounded-lg border border-[#23454e] bg-[#132f34] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
            >
              <option value="">Seleccionar vehículo</option>
              {vehiculos
                .filter((v: any) => v.estado === "OPERATIVO")
                .map((v: any) => (
                  <option key={v._id} value={v._id}>
                    {v.nombre} ({v.patente ?? "sin patente"})
                  </option>
                ))}
            </select>
          </div>

          {/* ORIGEN / DESTINO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm mb-1 block text-[#93c6c1]">Origen *</label>
              <select
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#23454e] bg-[#132f34] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
              >
                <option value="">Seleccionar origen</option>
                {Object.keys(DISTANCIAS_PREDEFINIDAS).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm mb-1 block text-[#93c6c1]">Destino *</label>
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#23454e] bg-[#132f34] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
              >
                <option value="">Seleccionar destino</option>
                {Object.keys(DISTANCIAS_PREDEFINIDAS).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DISTANCIA */}
          <div>
            <label className="text-sm mb-1 block text-[#93c6c1]">Distancia (km)</label>
            <input
              type="number"
              value={distanciaKm}
              onChange={(e) => setDistanciaKm(e.target.value)}
              placeholder="Distancia en km"
              className="px-4 py-2 rounded-lg border border-[#23454e] bg-[#132f34] text-gray-200"
              readOnly
            />
          </div>

          {/* ESTADO */}
          <div>
            <label className="text-sm mb-1 block text-[#93c6c1]">Estado</label>
            <select
              value={estado}
              onChange={(e) =>
                setEstado(
                  e.target.value as
                    | "PENDIENTE"
                    | "EN_CURSO"
                    | "FINALIZADO"
                    | "CANCELADO"
                )
              }
              className="px-4 py-2 rounded-lg border border-[#23454e] bg-[#132f34] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
            >
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN_CURSO">EN CURSO</option>
              <option value="FINALIZADO">FINALIZADO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>

          {/* BOTÓN GUARDAR */}
          <button
            type="submit"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-semibold transition"
          >
            <Save size={18} /> Guardar viaje
          </button>
        </form>
      </div>
    </div>
  );
}
