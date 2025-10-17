"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function EditViajePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const viaje = useQuery(api.viajes.obtener, { id: id as any });
  const actualizar = useMutation(api.viajes.actualizar);
  const eliminar = useMutation(api.viajes.eliminar);

  const clientes = useQuery(api.clientes_ventas.listar, {}) ?? [];
  const choferes = useQuery(api.choferes.listar, {}) ?? [];
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (viaje) setData(viaje);
  }, [viaje]);

  const handleChange = (key: string, value: any) => {
    setData({ ...data, [key]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await actualizar({ id: id as any, ...data });
      router.push("/viajes");
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!data)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1b1e] text-[#e8f9f9]">
        Cargando viaje...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0d1b1e] p-8 text-[#e8f9f9]">
      <div className="max-w-3xl mx-auto bg-[#11292e] rounded-2xl border border-[#1e3c42] p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Editar Viaje</h1>
          <Link href="/viajes" className="flex items-center gap-2 text-[#36b6b0] hover:text-[#2ca6a4]">
            <ArrowLeft size={18} /> Volver
          </Link>
        </div>

        {error && <div className="bg-red-800/30 text-red-300 px-4 py-2 rounded-lg">{error}</div>}

        <form onSubmit={handleSave} className="grid gap-4">
          <select
            value={data.clienteId}
            onChange={(e) => handleChange("clienteId", e.target.value)}
            className="px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
          >
            {clientes.map((c: any) => (
              <option key={c._id} value={c._id}>
                {c.alias || c.razonSocial}
              </option>
            ))}
          </select>

          <select
            value={data.choferId}
            onChange={(e) => handleChange("choferId", e.target.value)}
            className="px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
          >
            {choferes.map((ch: any) => (
              <option key={ch._id} value={ch._id}>
                {ch.nombre}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={data.origen}
            onChange={(e) => handleChange("origen", e.target.value)}
            placeholder="Origen"
            className="px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
          />

          <input
            type="text"
            value={data.destino}
            onChange={(e) => handleChange("destino", e.target.value)}
            placeholder="Destino"
            className="px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
          />

          <input
            type="number"
            value={data.distanciaKm}
            onChange={(e) => handleChange("distanciaKm", e.target.value)}
            placeholder="Distancia (km)"
            className="px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
          />

          <select
            value={data.estado}
            onChange={(e) => handleChange("estado", e.target.value)}
            className="px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
          >
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="EN_CURSO">EN CURSO</option>
            <option value="FINALIZADO">FINALIZADO</option>
            <option value="CANCELADO">CANCELADO</option>
          </select>

          <div className="flex items-center gap-3 mt-4">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-semibold"
            >
              <Save size={18} className="inline-block mr-1" /> Guardar cambios
            </button>

            <button
              type="button"
              onClick={async () => {
                if (confirm("¿Eliminar este viaje?")) {
                  await eliminar({ id: id as any });
                  router.push("/viajes");
                }
              }}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              <Trash2 size={18} className="inline-block mr-1" /> Eliminar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
