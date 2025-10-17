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

export default function NuevoViajePage() {
  const router = useRouter();
  const crear = useMutation(api.viajes.crear);
  const clientes = useQuery(api.clientes_ventas.listar, {}) ?? [];
  const choferes = useQuery(api.choferes.listar, {}) ?? [];

  const [clienteId, setClienteId] = useState<Id<"clientes_ventas"> | "">("");
  const [choferId, setChoferId] = useState<Id<"choferes"> | "">("");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [distanciaKm, setDistanciaKm] = useState("");
  const [estado, setEstado] = useState<"PENDIENTE" | "EN_CURSO" | "FINALIZADO" | "CANCELADO">("PENDIENTE");
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
    if (!clienteId || !choferId || !origen || !destino || !distanciaKm) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    try {
      await crear({
        clienteId: clienteId as Id<"clientes_ventas">,
        choferId: choferId as Id<"choferes">,
        origen,
        destino,
        distanciaKm: parseFloat(distanciaKm),
        estado,
      });
      router.push("/viajes");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#1b3a3f] p-8 text-[#e8f9f9]">
      <div className="max-w-3xl mx-auto bg-[#24474d] rounded-xl border border-[#2f6368] shadow-lg p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Nuevo Viaje</h1>
          <Link
            href="/viajes"
            className="flex items-center gap-2 text-[#36b6b0] hover:text-[#2ca6a4]"
          >
            <ArrowLeft size={18} /> Volver
          </Link>
        </div>

        {error && (
          <div className="bg-red-800/30 text-red-300 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* CLIENTE */}
          <div>
            <label className="text-sm mb-1 block">Cliente *</label>
            <select
              value={clienteId}
              onChange={(e) =>
                setClienteId(e.target.value as Id<"clientes_ventas">)
              }
              className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f]"
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
            <label className="text-sm mb-1 block">Chofer *</label>
            <select
              value={choferId}
              onChange={(e) =>
                setChoferId(e.target.value as Id<"choferes">)
              }
              className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f]"
            >
              <option value="">Seleccionar chofer</option>
              {choferes.map((ch: any) => (
                <option key={ch._id} value={ch._id}>
                  {ch.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* ORIGEN / DESTINO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm mb-1 block">Origen *</label>
              <select
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f]"
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
              <label className="text-sm mb-1 block">Destino *</label>
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f]"
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
            <label className="text-sm mb-1 block">Distancia (km)</label>
            <input
              type="number"
              value={distanciaKm}
              onChange={(e) => setDistanciaKm(e.target.value)}
              placeholder="Distancia en km"
              className="px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f]"
              readOnly
            />
          </div>

          {/* ESTADO */}
          <div>
            <label className="text-sm mb-1 block">Estado</label>
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
              className="px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f]"
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
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-semibold"
          >
            <Save size={18} /> Guardar viaje
          </button>
        </form>
      </div>
    </div>
  );
}
