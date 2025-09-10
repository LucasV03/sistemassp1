"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";

export default function ProveedoresNuevoPage() {
  const router = useRouter();
  const crearProveedor = useMutation(api.proveedores.crear);

  const [form, setForm] = useState({
    nombre: "",
    contacto_principal: "",
    telefono: "",
    email: "",
    direccion: "",
    cuit: "",        // NUEVO
    activo: true,
    reputacion: 3,
    notas: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validaciones rápidas
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const telefonoOk = form.telefono.trim().length >= 6;
  const nombreOk = form.nombre.trim().length >= 2;
  const contactoOk = form.contacto_principal.trim().length >= 2;
  const direccionOk = form.direccion.trim().length >= 3;
  const cuitOk = form.cuit.trim().length >= 8; // regla simple, ajustá si querés validar formato

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!nombreOk) return bail("Ingresá un nombre válido.");
    if (!contactoOk) return bail("Ingresá un contacto válido.");
    if (!telefonoOk) return bail("Ingresá un teléfono válido.");
    if (!emailOk) return bail("Ingresá un email válido.");
    if (!direccionOk) return bail("Ingresá una dirección válida.");
    if (!cuitOk) return bail("Ingresá un CUIT válido.");

    try {
      await crearProveedor({
        nombre: form.nombre.trim(),
        contacto_principal: form.contacto_principal.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        direccion: form.direccion.trim(),
        cuit: form.cuit.trim(),  // NUEVO
        activo: form.activo,
        reputacion: Number(form.reputacion) || 3,
        notas: form.notas.trim(),
      } as any);

      router.push("/proveedores");
    } catch (err: any) {
      setError(err.message ?? "Error al crear proveedor");
    } finally {
      setSaving(false);
    }
  }

  function bail(msg: string) {
    setError(msg);
    setSaving(false);
  }

  return (
    <div className="p-6 space-y-6 text-gray-100">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nuevo proveedor</h1>
        <Link href="/proveedores" className="text-gray-300 bg-indigo-700 p-1 rounded">
          ← Volver
        </Link>
      </div>

      <form onSubmit={onSubmit} className="grid max-w-3xl grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre*"
            placeholder="Ej: Repuestar SRL"
            value={form.nombre}
            onChange={(v) => setForm((s) => ({ ...s, nombre: v }))}
            error={!nombreOk && form.nombre.length > 0 ? "Nombre demasiado corto." : undefined}
          />
          <Input
            label="Contacto*"
            placeholder="Ej: Ana López"
            value={form.contacto_principal}
            onChange={(v) => setForm((s) => ({ ...s, contacto_principal: v }))}
            error={!contactoOk && form.contacto_principal.length > 0 ? "Contacto demasiado corto." : undefined}
          />
          <Input
            label="Teléfono*"
            placeholder="Ej: 381-555-1234"
            value={form.telefono}
            onChange={(v) => setForm((s) => ({ ...s, telefono: v }))}
            error={!telefonoOk && form.telefono.length > 0 ? "Teléfono inválido." : undefined}
          />
          <Input
            label="Email*"
            type="email"
            placeholder="Ej: ventas@repuestar.com"
            value={form.email}
            onChange={(v) => setForm((s) => ({ ...s, email: v }))}
            error={!emailOk && form.email.length > 0 ? "Email inválido." : undefined}
          />
          <Input
            label="Dirección*"
            placeholder="Ej: Av. San Martín 450"
            value={form.direccion}
            onChange={(v) => setForm((s) => ({ ...s, direccion: v }))}
            className="sm:col-span-2"
            error={!direccionOk && form.direccion.length > 0 ? "Dirección inválida." : undefined}
          />
          <Input
            label="CUIT*"
            placeholder="Ej: 20-12345678-3"
            value={form.cuit}
            onChange={(v) => setForm((s) => ({ ...s, cuit: v }))}
            error={!cuitOk && form.cuit.length > 0 ? "CUIT inválido." : undefined}
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
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="mt-1 text-xs text-gray-500">Escala 1–5 (3 por defecto).</p>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-gray-300">Notas</label>
            <textarea
              rows={4}
              placeholder="Observaciones..."
              value={form.notas}
              onChange={(e) => setForm((s) => ({ ...s, notas: e.target.value }))}
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            disabled={saving}
            className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <Link
            href="/proveedores"
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
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  placeholder?: string;
  error?: string;
}) {
  const invalid = Boolean(error);
  return (
    <div className={className}>
      <label className="mb-1 block text-sm text-gray-300">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 ${
          invalid
            ? "border-red-700 bg-red-950/40 text-red-200 focus:ring-red-700"
            : "border-gray-700 bg-gray-900 text-gray-100 focus:ring-blue-600"
        }`}
      />
      {invalid && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}
