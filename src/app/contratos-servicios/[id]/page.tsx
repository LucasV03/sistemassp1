"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function EditContratoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const contrato = useQuery(api.contratos_servicios.obtener, { id: id as any });
  const actualizar = useMutation(api.contratos_servicios.actualizar);
  const eliminar = useMutation(api.contratos_servicios.eliminar);
  const clientes = useQuery(api.clientes_ventas.listar, {}) ?? [];

  const tiposServicio = [
    "Transporte de carga",
    "Traslado de personal",
    "Logística minera",
    "Alquiler de maquinaria",
    "Mantenimiento y soporte",
    "Gestión de residuos",
  ];

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (contrato) setData(contrato);
  }, [contrato]);

  const handleChange = (key: string, value: any) => {
    setData({ ...data, [key]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await actualizar({ id: id as any, ...data });
      router.push("/contratos-servicios");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!data)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1b1e] text-[#e8f9f9]">
        Cargando contrato...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0d1b1e] p-8 text-[#e8f9f9]">
      <div className="max-w-3xl mx-auto bg-[#11292e] rounded-2xl border border-[#1e3c42] shadow-lg p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Editar Contrato</h1>
          <Link
            href="/contratos-servicios"
            className="flex items-center gap-2 text-[#36b6b0] hover:text-[#2ca6a4]"
          >
            <ArrowLeft size={18} /> Volver
          </Link>
        </div>

        {error && (
          <div className="bg-red-800/30 text-red-300 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="grid gap-4">
          {/* Cliente */}
          <div>
            <label className="text-sm mb-1 block text-[#93c6c1]">Cliente</label>
            <select
              value={data.clienteId}
              onChange={(e) => handleChange("clienteId", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
            >
              {clientes.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.alias && c.alias.trim() !== ""
                    ? `${c.alias} (${c.razonSocial})`
                    : c.razonSocial}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de servicio */}
          <div>
            <label className="text-sm mb-1 block text-[#93c6c1]">Tipo de servicio</label>
            <select
              value={data.tipo}
              onChange={(e) => handleChange("tipo", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
            >
              {tiposServicio.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <input
            type="number"
            value={data.tarifaBase}
            onChange={(e) => handleChange("tarifaBase", e.target.value)}
            placeholder="Tarifa base"
            className="px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              value={data.fechaInicio}
              onChange={(e) => handleChange("fechaInicio", e.target.value)}
              className="px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
            />
            <input
              type="date"
              value={data.fechaFin || ""}
              onChange={(e) => handleChange("fechaFin", e.target.value)}
              className="px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
            />
          </div>

          <select
            value={data.estado}
            onChange={(e) => handleChange("estado", e.target.value)}
            className="px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
          >
            <option value="VIGENTE">VIGENTE</option>
            <option value="FINALIZADO">FINALIZADO</option>
            <option value="PENDIENTE">PENDIENTE</option>
          </select>

          <textarea
            value={data.notas || ""}
            onChange={(e) => handleChange("notas", e.target.value)}
            rows={3}
            placeholder="Notas"
            className="px-4 py-2 rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
          />

          <div className="flex items-center gap-3 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-semibold disabled:opacity-60"
            >
              <Save size={18} className="inline-block mr-1" />
              Guardar cambios
            </button>
            <button
              type="button"
              onClick={async () => {
                if (
                  confirm("¿Seguro que deseas eliminar este contrato?")
                ) {
                  await eliminar({ id: id as any });
                  router.push("/contratos-servicios");
                }
              }}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              <Trash2 size={18} className="inline-block mr-1" />
              Eliminar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
