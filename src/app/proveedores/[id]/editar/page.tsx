// src/app/proveedores/[id]/editar/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";

export default function ProveedorEditarPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as string; // id en la URL (string)
  const router = useRouter();

  // Puede ser undefined mientras carga
  const proveedor = useQuery(api.proveedores.obtener, { id: id as any });
  const editar = useMutation(api.proveedores.editar);

  const [form, setForm] = useState({
    nombre: "",
    contacto_principal: "",
    telefono: "",
    email: "",
    direccion: "",
    cuit: "", // NUEVO
    codigo: "",
    activo: true,
    reputacion: 3,
    notas: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (proveedor) {
      setForm({
        nombre: proveedor.nombre,
        contacto_principal: proveedor.contacto_principal,
        telefono: proveedor.telefono,
        email: proveedor.email,
        direccion: proveedor.direccion,
        cuit: proveedor.cuit ?? "",
        codigo: proveedor.codigo ?? "",
        activo: proveedor.activo,
        reputacion: proveedor.reputacion ?? 3,
        notas: proveedor.notas ?? "",
      });
    }
  }, [proveedor]);

  if (!proveedor) {
    return <div className="p-6 text-gray-300">Cargando...</div>;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // ⚠️ Narrowing dentro de la misma función:
    if (!proveedor) {
      setError("El proveedor aún no está cargado.");
      setSaving(false);
      return;
    }

    try {
      await editar({
        id: proveedor._id, // ahora TS sabe que proveedor está definido
        data: form,
      });
      router.push(`/proveedores/${id}`);
    } catch (err: any) {
      setError(err.message ?? "Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1b3a3f] text-[#e6f6f7] p-6 flex items-center justify-center">
      <article className="w-full max-w-3xl bg-[#24474d] border border-[#2f6368] rounded-xl p-6 shadow-sm">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Editar proveedor</h1>
          <Link href={`/proveedores/${id}`} className="px-3 py-1.5 rounded-lg border border-[#2f6368] bg-[#2b5a60] hover:bg-[#2f6368]">
            ← Volver
          </Link>
        </header>

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre*"
            value={form.nombre}
            onChange={(v) => setForm((s) => ({ ...s, nombre: v }))}
          />
          <Input
            label="Contacto*"
            value={form.contacto_principal}
            onChange={(v) => setForm((s) => ({ ...s, contacto_principal: v }))}
          />
          <Input
            label="Teléfono*"
            value={form.telefono}
            onChange={(v) => setForm((s) => ({ ...s, telefono: v }))}
          />
          <Input
            label="Email*"
            type="email"
            value={form.email}
            onChange={(v) => setForm((s) => ({ ...s, email: v }))}
          />
          <Input
            label="Dirección*"
            value={form.direccion}
            onChange={(v) => setForm((s) => ({ ...s, direccion: v }))}
            className="sm:col-span-2"
          />
          <Input
            label="CUIT*"
            value={form.cuit}
            onChange={(v) => setForm((s) => ({ ...s, cuit: v }))}
          />
          <Input
            label="Codigo*"
            value={form.codigo}
            onChange={(v) => setForm((s) => ({ ...s, codigo: v }))}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm((s) => ({ ...s, activo: e.target.checked }))}
            />
            <span>Activo</span>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">Reputación</label>
            <input
              type="number"
              min={1}
              max={5}
              value={form.reputacion}
              onChange={(e) => setForm((s) => ({ ...s, reputacion: Number(e.target.value) }))}
            className="w-full rounded-lg border border-[#2c5a60] bg-[#24474d] px-3 py-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-[#36b6b0]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-[#b7e2de]">Notas</label>
            <textarea
              rows={4}
              value={form.notas}
              onChange={(e) => setForm((s) => ({ ...s, notas: e.target.value }))}
              className="w-full rounded-lg border border-[#2c5a60] bg-[#24474d] px-3 py-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-[#36b6b0]"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[#2ca6a4] hover:bg-[#249390] text-white text-sm font-semibold shadow-sm disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <Link
            href={`/proveedores/${id}`}
            className="px-4 py-2 rounded-lg border border-[#2f6368] bg-[#2b5a60] hover:bg-[#2f6368] text-sm"
          >
            Cancelar
          </Link>
        </div>
      </form>
      </article>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm text-[#b7e2de]">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        className="w-full rounded-lg border border-[#2c5a60] bg-[#24474d] px-3 py-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-[#36b6b0]"
      />
    </div>
  );
}
