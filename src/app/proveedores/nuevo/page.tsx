
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";

type NuevoRepuesto = {
  codigo: string;
  nombre: string;
  categoria: string;
  vehiculo: string;
  precioUnitario: number;
  stock: number;
};

export default function ProveedoresNuevoPage() {
  const router = useRouter();

  // Mutations
  const crearProveedor = useMutation(api.proveedores.crear);
  const crearRepuesto = useMutation(api.repuestos.crear);

  // Repuestos existentes
  const repuestos = useQuery(api.repuestos.listar, {}) ?? [];

  // Form proveedor
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

  // Búsqueda/selección de repuestos existentes
  const [search, setSearch] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>([]); // Id<"repuestos"> como string

  const repuestosFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return repuestos;
    return repuestos.filter((r) =>
      [
        r.codigo,
        r.nombre,
        r.categoria,
        r.vehiculo,
        r.descripcion ?? "",
        r.marca ?? "",
        r.modeloCompatible ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [repuestos, search]);

  const toggleSelect = (idStr: string) => {
    setSeleccionados((prev) =>
      prev.includes(idStr) ? prev.filter((x) => x !== idStr) : [...prev, idStr]
    );
  };

  // Repuestos nuevos (no existentes)
  const [nuevos, setNuevos] = useState<NuevoRepuesto[]>([]);
  const [nuevo, setNuevo] = useState<NuevoRepuesto>({
    codigo: "",
    nombre: "",
    categoria: "",
    vehiculo: "",
    precioUnitario: 0,
    stock: 0,
  });

  const addNuevo = () => {
    // Validaciones simples
    if (!nuevo.codigo.trim() || !nuevo.nombre.trim() || !nuevo.categoria.trim()) return;
    setNuevos((arr) => [...arr, { ...nuevo }]);
    setNuevo({
      codigo: "",
      nombre: "",
      categoria: "",
      vehiculo: "",
      precioUnitario: 0,
      stock: 0,
    });
  };

  const removeNuevo = (i: number) => {
    setNuevos((arr) => arr.filter((_, idx) => idx !== i));
  };

  // UX estados
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helpers validaciones rápidas
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const telefonoOk = form.telefono.trim().length >= 6;
  const nombreOk = form.nombre.trim().length >= 2;
  const contactoOk = form.contacto_principal.trim().length >= 2;
  const direccionOk = form.direccion.trim().length >= 3;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!nombreOk) return bail("Ingresá un nombre de proveedor válido (mín. 2 caracteres).");
    if (!contactoOk) return bail("Ingresá un nombre de contacto válido (mín. 2 caracteres).");
    if (!telefonoOk) return bail("Ingresá un teléfono válido.");
    if (!emailOk) return bail("Ingresá un email válido (ej: ventas@empresa.com).");
    if (!direccionOk) return bail("Ingresá una dirección válida.");

    try {
      // 1) Crear repuestos nuevos (si hay)
      const idsNuevos: string[] = [];
      for (const r of nuevos) {
        const id = await crearRepuesto({
          codigo: r.codigo.trim(),
          nombre: r.nombre.trim(),
          categoria: r.categoria.trim(),
          vehiculo: r.vehiculo.trim(),
          precioUnitario: Number(r.precioUnitario) || 0,
          stock: Number(r.stock) || 0,
          // opcionales con defaults
          descripcion: "",
          marca: "",
          modeloCompatible: "",
          ubicacion: "",
          fechaIngreso: new Date().toISOString(),
        } as any);
        idsNuevos.push(String(id));
      }

      // 2) Crear proveedor referenciando seleccionados + nuevos
      await crearProveedor({
        ...form,
        email: form.email.trim(),
        productos_ofrecidos: [...seleccionados, ...idsNuevos] as any,
      });

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
        <Link href="/proveedores" className="text-gray-300 hover:text-white">
          ← Volver
        </Link>
      </div>

      <form onSubmit={onSubmit} className="grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Columna izquierda: datos del proveedor */}
        <section className="space-y-4">
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
            placeholder="Ej: Av. San Martín 450, San Miguel de Tucumán"
            value={form.direccion}
            onChange={(v) => setForm((s) => ({ ...s, direccion: v }))}
            className="sm:col-span-2"
            error={!direccionOk && form.direccion.length > 0 ? "Dirección inválida." : undefined}
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

          <div>
            <label className="mb-1 block text-sm text-gray-300">Notas</label>
            <textarea
              rows={4}
              placeholder="Ej: Maneja cuenta corriente. Entrega en 24 h en GBA."
              value={form.notas}
              onChange={(e) => setForm((s) => ({ ...s, notas: e.target.value }))}
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </section>

        {/* Columna derecha: repuestos ofrecidos */}
        <section className="space-y-5">
          <div>
            <h2 className="mb-2 text-lg font-medium">Repuestos ofrecidos</h2>
            <input
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Buscar por nombre, código, categoría, vehículo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="mt-3 max-h-60 overflow-y-auto rounded-md border border-gray-800">
              {repuestosFiltrados.map((r) => {
                const idStr = String(r._id);
                const checked = seleccionados.includes(idStr);
                return (
                  <label
                    key={idStr}
                    className="flex cursor-pointer items-center gap-3 border-b border-gray-800 px-3 py-2 text-sm hover:bg-gray-900/40"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelect(idStr)}
                    />
                    <div>
                      <div className="font-medium">{r.nombre}</div>
                      <div className="text-xs text-gray-400">
                        {r.codigo} — {r.categoria} · {r.vehiculo}
                      </div>
                    </div>
                  </label>
                );
              })}
              {repuestosFiltrados.length === 0 && (
                <div className="px-3 py-6 text-sm text-gray-400">Sin resultados.</div>
              )}
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Seleccionados: {seleccionados.length}
            </p>
          </div>

          <div className="rounded-lg border border-gray-800 p-3">
            <h3 className="mb-3 font-medium">Agregar repuesto no existente</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <SmallInput
                label="Código*"
                placeholder="Ej: REP-012"
                value={nuevo.codigo}
                onChange={(v) => setNuevo((s) => ({ ...s, codigo: v }))}
              />
              <SmallInput
                label="Nombre*"
                placeholder="Ej: Filtro de polen"
                value={nuevo.nombre}
                onChange={(v) => setNuevo((s) => ({ ...s, nombre: v }))}
              />
              <SmallInput
                label="Categoría*"
                placeholder="Ej: Filtros / Motor / Frenos"
                value={nuevo.categoria}
                onChange={(v) => setNuevo((s) => ({ ...s, categoria: v }))}
              />
              <SmallInput
                label="Vehículo"
                placeholder="Ej: Colectivo / Traffic"
                value={nuevo.vehiculo}
                onChange={(v) => setNuevo((s) => ({ ...s, vehiculo: v }))}
              />
              <SmallInput
                type="number"
                label="Precio unitario"
                placeholder="Ej: 15000"
                value={String(nuevo.precioUnitario)}
                onChange={(v) => setNuevo((s) => ({ ...s, precioUnitario: Number(v) || 0 }))}
              />
              <SmallInput
                type="number"
                label="Stock"
                placeholder="Ej: 10"
                value={String(nuevo.stock)}
                onChange={(v) => setNuevo((s) => ({ ...s, stock: Number(v) || 0 }))}
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={addNuevo}
                className="rounded-md bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600"
              >
                + Agregar a la lista
              </button>
              {nuevos.length > 0 && (
                <span className="text-xs text-gray-400">
                  {nuevos.length} por crear
                </span>
              )}
            </div>

            {nuevos.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-gray-200">
                {nuevos.map((r, i) => (
                  <li key={`${r.codigo}-${i}`} className="flex items-center justify-between">
                    <span>
                      <span className="font-medium">{r.nombre}</span>{" "}
                      <span className="text-gray-400">
                        — {r.codigo} · {r.categoria} · {r.vehiculo || "s/vehículo"}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeNuevo(i)}
                      className="text-xs text-red-300 hover:text-red-200"
                    >
                      quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Footer del form */}
        <div className="lg:col-span-2">
          {error && (
            <div className="mb-3 rounded-md border border-red-800 bg-red-900/20 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
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
        </div>
      </form>
    </div>
  );
}

/* ---------- UI helpers ---------- */

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

function SmallInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-300">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-blue-600"
      />
    </div>
  );
}
