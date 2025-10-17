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

  // 🔹 Queries y Mutations
  const viaje = useQuery(api.viajes.obtener, { id: id as Id<"viajes"> });
  const actualizar = useMutation(api.viajes.actualizar);
  const eliminar = useMutation(api.viajes.eliminar);
  const clientes = useQuery(api.clientes_ventas.listar, {}) ?? [];
  const choferes = useQuery(api.choferes.listar, {}) ?? [];

  // 🔹 Estado local
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (viaje) setData(viaje);
  }, [viaje]);

  const handleChange = (key: string, value: any) => {
    setData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.clienteId || !data?.choferId || !data?.origen || !data?.destino) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    try {
      setLoading(true);
      await actualizar({
        id: id as Id<"viajes">,
        clienteId: data.clienteId as Id<"clientes_ventas">,
        choferId: data.choferId as Id<"choferes">,
        origen: data.origen,
        destino: data.destino,
        distanciaKm: Number(data.distanciaKm),
        estado: data.estado,
      });
      router.push("/viajes");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (confirm("¿Eliminar este viaje?")) {
      await eliminar({ id: id as Id<"viajes"> });
      router.push("/viajes");
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
      <div className="max-w-3xl mx-auto bg-[#11292e] rounded-2xl border border-[#1e3c42] p-8 space-y-6 shadow-lg">
        {/* 🔹 Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Editar Viaje</h1>
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

        {/* 🔹 Formulario */}
        <form onSubmit={handleSave} className="grid gap-4">
          {/* Cliente */}
          <div>
            <label className="text-sm text-[#93c6c1] block mb-1">Cliente *</label>
            <select
              value={data.clienteId}
              onChange={(e) => handleChange("clienteId", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:ring-2 focus:ring-[#36b6b0]"
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.alias || c.razonSocial}
                </option>
              ))}
            </select>
          </div>

          {/* Chofer */}
          <div>
            <label className="text-sm text-[#93c6c1] block mb-1">Chofer *</label>
            <select
              value={data.choferId}
              onChange={(e) => handleChange("choferId", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:ring-2 focus:ring-[#36b6b0]"
            >
              <option value="">Seleccionar chofer</option>
              {choferes.map((ch: any) => (
                <option key={ch._id} value={ch._id}>
                  {ch.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Origen y destino */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#93c6c1] block mb-1">Origen *</label>
              <input
                type="text"
                value={data.origen}
                onChange={(e) => handleChange("origen", e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:ring-2 focus:ring-[#36b6b0]"
              />
            </div>
            <div>
              <label className="text-sm text-[#93c6c1] block mb-1">Destino *</label>
              <input
                type="text"
                value={data.destino}
                onChange={(e) => handleChange("destino", e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:ring-2 focus:ring-[#36b6b0]"
              />
            </div>
          </div>

          {/* Distancia */}
          <div>
            <label className="text-sm text-[#93c6c1] block mb-1">Distancia (km)</label>
            <input
              type="number"
              value={data.distanciaKm}
              onChange={(e) => handleChange("distanciaKm", Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:ring-2 focus:ring-[#36b6b0]"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="text-sm text-[#93c6c1] block mb-1">Estado *</label>
            <select
              value={data.estado}
              onChange={(e) => handleChange("estado", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:ring-2 focus:ring-[#36b6b0]"
            >
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN_CURSO">EN CURSO</option>
              <option value="FINALIZADO">FINALIZADO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleEliminar}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              <Trash2 size={18} /> Eliminar
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                loading
                  ? "bg-[#24474d] cursor-not-allowed"
                  : "bg-[#36b6b0] hover:bg-[#2ca6a4] text-white"
              }`}
            >
              <Save size={18} /> {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
  