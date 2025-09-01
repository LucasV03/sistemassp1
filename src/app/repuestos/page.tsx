// src/app/repuestos/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMemo, useState } from "react";
import RepuestoCard from "../../components/RepuestoCard";
import { useRouter } from "next/navigation";

export default function RepuestosPage() {
  const repuestos = useQuery(api.repuestos.listar);
  const addRepuesto = useMutation(api.repuestos.crear);
  const eliminarRepuesto = useMutation(api.repuestos.eliminar);
  const router = useRouter();

  const loading = repuestos === undefined;
  const data = repuestos ?? [];

  // FORM (solo info del repuesto, sin stock ni deposito)
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [vehiculo, setVehiculo] = useState("");
  const [marca, setMarca] = useState("");
  const [modeloCompatible, setModeloCompatible] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState<number>(0);

  // SORT
  const [sortBy, setSortBy] =
    useState<"codigo" | "nombre" | "categoria" | "vehiculo">("nombre");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const norm = (s: any) =>
    (s ?? "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const repuestosOrdenados = useMemo(() => {
    const arr = [...data];
    const dir = sortDir === "asc" ? 1 : -1;
    return arr.sort((a: any, b: any) => {
      const va = norm(a?.[sortBy]);
      const vb = norm(b?.[sortBy]);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [data, sortBy, sortDir]);

  // HANDLER
  const handleAddRepuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    await addRepuesto({
      codigo,
      nombre,
      descripcion,
      categoria,
      vehiculo,
      marca,
      modeloCompatible,
      precioUnitario,
    });

    setCodigo("");
    setNombre("");
    setDescripcion("");
    setCategoria("");
    setVehiculo("");
    setMarca("");
    setModeloCompatible("");
    setPrecioUnitario(0);
  };

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-8">
      <section className="rounded-2xl border p-6 shadow-sm bg-gray-100 dark:bg-neutral-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl font-semibold">📦 Repuestos</h2>

          {/* Ordenar */}
          <div className="flex items-center gap-2">
            <label className="text-sm">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="nombre">Nombre</option>
              <option value="codigo">Código</option>
              <option value="categoria">Categoría</option>
              <option value="vehiculo">Vehículo</option>
            </select>
            <button
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="px-3 py-1 text-sm border rounded"
            >
              {sortDir === "asc" ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {/* LISTADO */}
        {loading ? (
          <p>Cargando...</p>
        ) : repuestosOrdenados.length === 0 ? (
          <p>No hay repuestos registrados.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repuestosOrdenados.map((r: any) => (
              <RepuestoCard
                key={r._id}
                repuesto={r}
                onUpdate={() => router.push(`/repuestos/${r.codigo}/editar`)}
                onDelete={() => eliminarRepuesto({ id: r._id })}
              />
            ))}
          </div>
        )}

        {/* FORM */}
        <div className="mt-12">
          <article className="border rounded-xl p-6 bg-gray-100 dark:bg-neutral-800">
            <h3 className="text-xl font-semibold mb-4">➕ Agregar repuesto</h3>

            <form onSubmit={handleAddRepuesto} className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-5">
                <Field label="Código">
                  <Input value={codigo} onChange={setCodigo} required />
                </Field>
                <Field label="Nombre">
                  <Input value={nombre} onChange={setNombre} required />
                </Field>
                <Field label="Descripción" className="flex-1 min-w-[250px]">
                  <Textarea value={descripcion} onChange={setDescripcion} />
                </Field>
                <Field label="Categoría">
                  <Input value={categoria} onChange={setCategoria} required />
                </Field>
                <Field label="Vehículo">
                  <Input value={vehiculo} onChange={setVehiculo} required />
                </Field>
                <Field label="Marca">
                  <Input value={marca} onChange={setMarca} />
                </Field>
                <Field label="Modelo Compatible">
                  <Input
                    value={modeloCompatible}
                    onChange={setModeloCompatible}
                  />
                </Field>
                <Field label="Precio Unitario">
                  <Input
                    type="number"
                    value={precioUnitario}
                    onChange={setPrecioUnitario}
                    required
                  />
                </Field>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-800 text-white rounded-lg"
                >
                  Guardar Repuesto
                </button>
              </div>
            </form>
          </article>
        </div>
      </section>
    </main>
  );
}

/* Helpers */
function Field({ label, children, className = "" }: any) {
  return (
    <div className={`flex flex-col flex-1 min-w-[220px] ${className}`}>
      <label className="text-sm mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({ type = "text", value, onChange, required = false }: any) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) =>
        onChange(type === "number" ? Number(e.target.value) : e.target.value)
      }
      required={required}
      className="border rounded px-3 py-2 text-sm w-full"
    />
  );
}

function Textarea({ value, onChange }: any) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded px-3 py-2 text-sm w-full"
      rows={3}
    />
  );
}
