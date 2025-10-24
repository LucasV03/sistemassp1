"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NuevoMantenimientoPage() {
  const router = useRouter();
  const crear = useMutation(api.mantenimientos.crear);
  const vehiculos = useQuery(api.vehiculos.listar) ?? [];

  const [form, setForm] = useState({
    vehiculoId: "",
    tipo: "",
    fecha: "",
    costo: "",
    descripcion: "",
    estado: "PENDIENTE",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehiculoId || !form.tipo || !form.fecha) {
      alert("⚠️ Completa los campos obligatorios.");
      return;
    }

    await crear({
      vehiculoId: form.vehiculoId as any,
      tipo: form.tipo,
      fecha: form.fecha,
      costo: form.costo ? Number(form.costo) : undefined,
      descripcion: form.descripcion,
      estado: form.estado as any,
    });

    alert("✅ Mantenimiento creado correctamente");
    router.push("/mantenimientos");
  };

  return (
    <div className="min-h-screen bg-[#0d1b1e] text-[#e8f8f8] p-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/mantenimientos" className="flex items-center gap-2 text-[#36b6b0] hover:text-[#2ca6a4]">
          <ArrowLeft size={18} />
          Volver
        </Link>
        <h1 className="text-2xl font-bold">Nuevo Mantenimiento</h1>
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-[#11292e] border border-[#1e3c42] rounded-2xl p-8 shadow-lg max-w-2xl mx-auto space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Vehículo *">
            <select
              value={form.vehiculoId}
              onChange={(e) => setForm({ ...form, vehiculoId: e.target.value })}
              className="bg-[#0e2529] text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-[#36b6b0]"
            >
              <option value="">Seleccionar...</option>
              {vehiculos.map((v: any) => (
                <option key={v._id} value={v._id}>
                  {v.nombre}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tipo *">
            <input
              type="text"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              placeholder="Ej: Cambio de aceite"
              className="bg-[#0e2529] text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-[#36b6b0]"
              required
            />
          </Field>

          <Field label="Fecha *">
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className="bg-[#0e2529] text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-[#36b6b0]"
              required
            />
          </Field>

          <Field label="Costo (opcional)">
            <input
              type="number"
              value={form.costo}
              onChange={(e) => setForm({ ...form, costo: e.target.value })}
              placeholder="Ej: 45000"
              className="bg-[#0e2529] text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-[#36b6b0]"
            />
          </Field>
        </div>

        <Field label="Descripción">
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Detalle del trabajo realizado o a realizar..."
            className="bg-[#0e2529] text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-[#36b6b0] h-28 resize-none"
          />
        </Field>

        <Field label="Estado">
          <select
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value })}
            className="bg-[#0e2529] text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-[#36b6b0]"
          >
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_CURSO">En curso</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>
        </Field>

        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2 bg-[#36b6b0] hover:bg-[#2ca6a4] text-white rounded-lg font-semibold transition"
        >
          <Save size={18} />
          Guardar
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-[#9ed1cd]">{label}</label>
      {children}
    </div>
  );
}
