"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { ArrowLeft, Save, Pencil, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { Id } from "@convex/_generated/dataModel";

export default function EditarVehiculoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const vehiculos = useQuery(api.vehiculos.listar, {}) ?? [];
  const marcas = useQuery(api.marcas_vehiculos.listar, {}) ?? [];
  const tipos = useQuery(api.tipos_vehiculo.listar, {}) ?? [];
  const actualizar = useMutation(api.vehiculos.actualizar);

  const v = vehiculos.find((x: any) => String(x._id) === String(id));

  const [form, setForm] = useState({
    nombre: "",
    marcaVehiculoId: "",
    patente: "",
    tipo: "",
    capacidad: "",
    estado: "OPERATIVO",
  });

  useEffect(() => {
    if (v) {
      setForm({
        nombre: v.nombre ?? "",
        marcaVehiculoId: v.marcaVehiculoId ? String(v.marcaVehiculoId) : "",
        patente: v.patente ?? "",
        tipo: v.tipoVehiculoId ? String(v.tipoVehiculoId) : "", // ✅ corregido
        capacidad: v.capacidad ? String(v.capacidad) : "",
        estado: v.estado ?? "OPERATIVO",
      });
    }
  }, [v]);

  if (!v)
    return (
      <div className="min-h-screen bg-[#0d1b1e] text-[#e8f9f9] flex items-center justify-center">
        No se encontró el vehículo.
      </div>
    );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await actualizar({
      id: v!._id as Id<"vehiculos">,
      nombre: form.nombre,
      marcaVehiculoId: form.marcaVehiculoId
        ? (form.marcaVehiculoId as Id<"marcas_vehiculos">)
        : v!.marcaVehiculoId,
      patente: form.patente || undefined,
      tipoVehiculoId: form.tipo
        ? (form.tipo as Id<"tipos_vehiculo">)
        : v!.tipoVehiculoId, // ✅ corregido
      capacidad: form.capacidad ? Number(form.capacidad) : undefined,
      estado: form.estado as any,
    });
    router.push(`/vehiculos/${String(v!._id)}`);
  }

  return (
    <main className="min-h-screen bg-[#0d1b1e] text-[#e8f9f9] px-6 py-10 flex flex-col items-center">
      {/* HEADER */}
      <div className="max-w-2xl w-full mb-8 flex items-center gap-2 text-[#36b6b0]">
        <Link
          href={`/vehiculos/${String(v._id)}`}
          className="flex items-center gap-1 hover:text-[#2ca6a4] transition"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Volver</span>
        </Link>
      </div>

      {/* TÍTULO */}
      <div className="flex flex-col gap-2 mb-6 max-w-2xl w-full">
        <div className="flex items-center gap-3">
          <Pencil size={28} className="text-[#36b6b0]" />
          <h1 className="text-3xl font-semibold tracking-wide text-[#e8f9f9]">
            Editar Vehículo
          </h1>
        </div>
        <p className="text-sm text-[#a8cfcf]/80">
          Actualizá los datos técnicos, tipo y estado de la unidad seleccionada.
        </p>
      </div>

      {/* CARD PRINCIPAL */}
      <article className="w-full max-w-2xl bg-[#1b3a3f] border border-[#2f6368] rounded-xl shadow-lg p-8 space-y-5">
        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="Nombre / Alias">
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Colectivo A-22"
              required
              className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#24474d] text-[#e8f9f9] focus:ring-2 focus:ring-[#36b6b0] placeholder-[#9abdbd]"
            />
          </Field>

          <Field label="Marca">
            <select
              value={form.marcaVehiculoId}
              onChange={(e) =>
                setForm({ ...form, marcaVehiculoId: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#24474d] text-[#e8f9f9] focus:ring-2 focus:ring-[#36b6b0]"
            >
              <option value="">Seleccionar marca...</option>
              {marcas.map((m: any) => (
                <option key={m._id} value={String(m._id)}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Patente">
            <input
              value={form.patente}
              onChange={(e) =>
                setForm({ ...form, patente: e.target.value.toUpperCase() })
              }
              placeholder="ABC123"
              className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#24474d] text-[#e8f9f9] focus:ring-2 focus:ring-[#36b6b0] placeholder-[#9abdbd]"
            />
          </Field>

          {/* ✅ Tipos dinámicos desde Convex */}
          <Field label="Tipo de transporte">
            {tipos.length > 0 ? (
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#24474d] text-[#e8f9f9] focus:ring-2 focus:ring-[#36b6b0]"
              >
                <option value="">Seleccionar tipo...</option>
                {tipos.map((t: any) => (
                  <option key={t._id} value={String(t._id)}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 bg-[#2b4a4d]/50 border border-[#345b5e] rounded-lg p-3 text-sm text-[#a8cfcf]">
                <AlertCircle className="text-yellow-400" size={18} />
                No hay tipos de vehículo registrados. Agregá algunos desde el panel de administración.
              </div>
            )}
          </Field>

          <Field label="Capacidad (personas)">
            <input
              type="number"
              value={form.capacidad}
              onChange={(e) => setForm({ ...form, capacidad: e.target.value })}
              placeholder="Ej: 45"
              className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#24474d] text-[#e8f9f9] focus:ring-2 focus:ring-[#36b6b0] placeholder-[#9abdbd]"
            />
          </Field>

          <Field label="Estado">
            <select
              value={form.estado}
              onChange={(e) =>
                setForm({
                  ...form,
                  estado: e.target.value as
                    | "OPERATIVO"
                    | "MANTENIMIENTO"
                    | "FUERA_SERVICIO",
                })
              }
              className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#24474d] text-[#e8f9f9] focus:ring-2 focus:ring-[#36b6b0]"
            >
              <option value="OPERATIVO">Operativo</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="FUERA_SERVICIO">Fuera de servicio</option>
            </select>
          </Field>

          {/* BOTONES */}
          <div className="flex justify-end pt-4 gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-lg bg-[#284b4f] hover:bg-[#2f6368] text-[#e8f9f9] font-medium transition shadow-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-semibold shadow-md transition"
            >
              <Save size={18} />
              Guardar Cambios
            </button>
          </div>
        </form>
      </article>
    </main>
  );
}

/* ---------- COMPONENTE FIELD ---------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#b5d9d7] tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}
