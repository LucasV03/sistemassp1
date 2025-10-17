"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

export default function EditarVehiculoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const vehiculos = useQuery(api.vehiculos.listar, {}) ?? [];
  const marcas = useQuery(api.marcas_vehiculos.listar, {}) ?? [];
  const actualizar = useMutation(api.vehiculos.actualizar);

  const v = vehiculos.find((x: any) => String(x._id) === String(id));

  const [form, setForm] = React.useState({
    nombre: "",
    marcaVehiculoId: "",
    patente: "",
    tipo: "",
    capacidad: "",
    estado: "OPERATIVO",
  } as any);

  React.useEffect(() => {
    if (v) {
      setForm({
        nombre: v.nombre ?? "",
        marcaVehiculoId: v.marcaVehiculoId ? String(v.marcaVehiculoId) : "",
        patente: v.patente ?? "",
        tipo: v.tipo ?? "",
        capacidad: v.capacidad ?? "",
        estado: v.estado ?? "OPERATIVO",
      });
    }
  }, [v]);

  if (!vehiculos)
    return (
      <div className="min-h-screen bg-[#0d1b1e] text-[#e6f6f7] p-6 flex items-center justify-center">
        Cargando…
      </div>
    );

  if (!v)
    return (
      <div className="min-h-screen bg-[#0d1b1e] text-[#e6f6f7] p-6 flex items-center justify-center">
        No se encontró el vehículo.
      </div>
    );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await actualizar({
  id: v!._id, // ✅ garantizamos que v no es undefined
  nombre: form.nombre,
  marcaVehiculoId: form.marcaVehiculoId ? (form.marcaVehiculoId as any) : undefined,
  patente: form.patente || undefined,
  tipo: form.tipo || undefined,
  capacidad: form.capacidad ? Number(form.capacidad) : undefined,
  estado: form.estado as any,
});
router.push(`/vehiculos/${String(v!._id)}`);

  }

  return (
    <main className="min-h-screen bg-[#0d1b1e] text-[#e6f6f7] p-6">
      <article className="max-w-3xl mx-auto border border-[#2f6368] rounded-xl p-6 bg-[#24474d] shadow-sm">
        <h1 className="text-2xl font-bold mb-6">✏️ Editar vehículo</h1>

        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4">
          <Field label="Nombre">
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </Field>

          <Field label="Marca">
            <select
              className="w-full rounded-lg border border-[#2c5a60] bg-[#24474d] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
              value={form.marcaVehiculoId}
              onChange={(e) => setForm({ ...form, marcaVehiculoId: e.target.value })}
            >
              <option value="">Sin marca</option>
              {marcas.map((m: any) => (
                <option key={String(m._id)} value={String(m._id)}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Patente">
            <Input value={form.patente} onChange={(e) => setForm({ ...form, patente: e.target.value })} />
          </Field>

          <Field label="Tipo">
            <Input value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
          </Field>

          <Field label="Capacidad (personas)">
            <Input type="number" value={form.capacidad} onChange={(e) => setForm({ ...form, capacidad: e.target.value })} />
          </Field>

          <Field label="Estado">
            <select
              className="w-full rounded-lg border border-[#2c5a60] bg-[#24474d] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              <option value="OPERATIVO">OPERATIVO</option>
              <option value="MANTENIMIENTO">MANTENIMIENTO</option>
              <option value="FUERA_SERVICIO">FUERA_SERVICIO</option>
            </select>
          </Field>

          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg border border-[#2f6368] bg-[#2b5a60] hover:bg-[#2f6368]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-[#2ca6a4] hover:bg-[#249390] text-white font-semibold shadow-sm"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </article>
    </main>
  );
}

import React from "react";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-[#b7e2de]">{label}</span>
      {children}
    </label>
  );
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-lg border border-[#2c5a60] bg-[#24474d] px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]",
        className,
      ].join(" ")}
    />
  );
}
