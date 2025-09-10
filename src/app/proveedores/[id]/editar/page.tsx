// src/app/proveedores/[id]/editar/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";

export default function ProveedorEditarPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as string; // Id del proveedor desde la URL
  const router = useRouter();

  // Convex acepta el string del Id directamente (lo castea internamente)
  const proveedor = useQuery(api.proveedores.obtener, { id: id as any });
  const editar = useMutation(api.proveedores.editar);

  const [form, setForm] = useState({
    nombre: "",
    contacto_principal: "",
    telefono: "",
    email: "",
    direccion: "",
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

    // 👇 Narrowing explícito: si por algún motivo todavía no llegó, corto.
    if (!proveedor) {
      setError("El proveedor aún no está cargado.");
      setSaving(false);
      return;
    }

    try {
      await editar({
        id: proveedor._id, // aquí sí uso el Id<"proveedores">
        data: form,
      });

      // Para navegar, uso el id de la URL (string) y evito que TS se queje.
      router.push(`/proveedores/${id}`);
    } catch (err: any) {
      setError(err.message ?? "Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6 text-gray-100">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Editar proveedor</h1>
        <Link href={`/proveedores/${id}`} className="text-gray-300 hover:text-white">
          ← Volver
        </Link>
      </div>

      <form onSubmit={onSubmit} className="grid max-w-3xl grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Nombre*" value={form.nombre} onChange={(v) => setForm((s) => ({ ...s, nombre: v }))} />
          <Input label="Contacto*" value={form.contacto_principal} onChange={(v) => setForm((s) => ({ ...s, contacto_principal: v }))} />
          <Input label="Teléfono*" value={form.telefono} onChange={(v) => setForm((s) => ({ ...s, telefono: v }))} />
          <Input label="Email*" type="email" value={form.email} onChange={(v) => setForm((s) => ({ ...s, email: v }))} />
          <Input label="Dirección*" value={form.direccion} onChange={(v) => setForm((s) => ({ ...s, direccion: v }))} className="sm:col-span-2" />
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
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-gray-300">Notas</label>
            <textarea
              rows={4}
              value={form.notas}
              onChange={(e) => setForm((s) => ({ ...s, notas: e.target.value }))}
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <Link
            href={`/proveedores/${id}`}
            className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
          >
            Cancelar
          </Link>
        </div>
      </form>
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
      <label className="mb-1 block text-sm text-gray-300">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-blue-600"
      />
    </div>
  );
}
