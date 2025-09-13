"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Selectores asíncronos
import SelectCategoria from "@/components/selectores/SelectCategoria";
import SelectMarca from "@/components/selectores/SelectMarca";
import SelectVehiculo from "@/components/selectores/SelectVehiculo";
import SelectModelo from "@/components/selectores/SelectModelo";

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

  // nombres (compatibles con tu API actual)
  const [categoria, setCategoria] = useState("");
  const [vehiculo, setVehiculo] = useState("");
  const [marca, setMarca] = useState("");
  const [modeloCompatible, setModeloCompatible] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState<number>(0);

  // ids para filtrar selects dependientes (opcional)
  const [categoriaId, setCategoriaId] = useState<string | undefined>(undefined);
  const [marcaId, setMarcaId] = useState<string | undefined>(undefined);
  const [vehiculoId, setVehiculoId] = useState<string | undefined>(undefined);
  const [modeloId, setModeloId] = useState<string | undefined>(undefined);

  // BUSCAR
  const [buscar, setBuscar] = useState("");

  // SORT
  const [sortBy, setSortBy] =
    useState<"codigo" | "nombre" | "categoria" | "vehiculo">("nombre");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Normalizador para búsqueda/sort
  const norm = (s: any) =>
    (s ?? "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  // Filtrado por búsqueda
  const repuestosFiltrados = useMemo(() => {
    const q = norm(buscar).trim();
    if (!q) return data;
    return data.filter((r: any) =>
      [r.codigo, r.nombre, r.descripcion, r.categoria, r.vehiculo, r.marca, r.modeloCompatible]
        .map(norm)
        .some((x) => x.includes(q))
    );
  }, [data, buscar]);

  // Ordenamiento
  const repuestosOrdenados = useMemo(() => {
    const arr = [...repuestosFiltrados];
    const dir = sortDir === "asc" ? 1 : -1;
    return arr.sort((a: any, b: any) => {
      const va = norm(a?.[sortBy]);
      const vb = norm(b?.[sortBy]);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [repuestosFiltrados, sortBy, sortDir]);

  // Handler de creación
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
    setCategoriaId(undefined);
    setMarcaId(undefined);
    setVehiculoId(undefined);
    setModeloId(undefined);
  };

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-8 text-white">
      <section className="rounded-2xl border border-neutral-800 bg-zinc-800 shadow-sm">
        {/* Header: título, búsqueda, ordenar, asignar, catálogos */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-6">
          <h2 className="text-2xl font-semibold">📦 Repuestos</h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Búsqueda */}
            <div className="flex items-center gap-2">
              <input
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Buscar por código, nombre, categoría, vehículo..."
                className="px-3 py-2 text-sm rounded-lg border border-neutral-700 bg-zinc-900 text-white min-w-[300px]"
              />
              {buscar && (
                <button
                  onClick={() => setBuscar("")}
                  className="px-3 py-2 text-sm rounded border border-neutral-600 bg-neutral-800 hover:bg-neutral-700"
                  title="Limpiar búsqueda"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Ordenar */}
            <div className="flex items-center gap-2">
              <label className="text-sm">Ordenar por:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border rounded px-2 py-1 text-sm text-white bg-zinc-700"
              >
                <option value="nombre">Nombre</option>
                <option value="codigo">Código</option>
                <option value="categoria">Categoría</option>
                <option value="vehiculo">Vehículo</option>
              </select>
              <button
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                className="px-3 py-1 text-sm border rounded text-white"
                title={sortDir === "asc" ? "Ascendente" : "Descendente"}
              >
                {sortDir === "asc" ? "▲" : "▼"}
              </button>
            </div>

            {/* Asignar */}
            <button
              className="px-3 py-1 text-sm border rounded text-white"
              onClick={() => router.push("/repuestos/asignar")}
            >
              Asignar repuesto
            </button>

            {/* Accesos a Catálogos */}
            <div className="hidden md:flex items-center gap-2 pl-3 ml-1 border-l border-neutral-700">
              <span className="text-xs uppercase text-neutral-400">Catálogos:</span>
              <Link
                href="/catalogos/categorias"
                className="px-2.5 py-1 text-sm border rounded bg-neutral-900 hover:bg-neutral-800"
              >
                Categorías
              </Link>
              <Link
                href="/catalogos/marcas"
                className="px-2.5 py-1 text-sm border rounded bg-neutral-900 hover:bg-neutral-800"
              >
                Marcas
              </Link>
              <Link
                href="/catalogos/vehiculos"
                className="px-2.5 py-1 text-sm border rounded bg-neutral-900 hover:bg-neutral-800"
              >
                Vehículos
              </Link>
              <Link
                href="/catalogos/modelos"
                className="px-2.5 py-1 text-sm border rounded bg-neutral-900 hover:bg-neutral-800"
              >
                Modelos
              </Link>
            </div>
          </div>
        </div>

        {/* LISTADO EN TABLA */}
        <div className="rounded border-t border-neutral-800 overflow-x-auto">
          {loading ? (
            <div className="p-4 text-neutral-300">Cargando...</div>
          ) : repuestosOrdenados.length === 0 ? (
            <div className="p-4 text-neutral-300">
              {buscar
                ? "No se encontraron repuestos que coincidan con la búsqueda."
                : "No hay repuestos registrados."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-neutral-900">
                <tr>
                  <th className="p-3 text-left">Código</th>
                  <th className="p-3 text-left">Nombre</th>
                  <th className="p-3 text-left">Descripción</th>
                  <th className="p-3 text-left">Categoría</th>
                  <th className="p-3 text-left">Vehículo</th>
                  <th className="p-3 text-left">Marca</th>
                  <th className="p-3 text-left">Modelo compatible</th>
                  <th className="p-3 text-right">Precio unitario</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {repuestosOrdenados.map((r: any) => (
                  <tr
                    key={r._id}
                    className="border-t border-neutral-800 hover:bg-neutral-900/40"
                  >
                    <td className="p-3">{r.codigo}</td>
                    <td className="p-3">{r.nombre}</td>
                    <td className="p-3 max-w-[380px] truncate" title={r.descripcion}>
                      {r.descripcion}
                    </td>
                    <td className="p-3">{r.categoria}</td>
                    <td className="p-3">{r.vehiculo}</td>
                    <td className="p-3">{r.marca}</td>
                    <td className="p-3">{r.modeloCompatible}</td>
                    <td className="p-3 text-right">
                      {Number(r.precioUnitario ?? 0).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
                          onClick={() => router.push(`/repuestos/${r.codigo}/editar`)}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarRepuesto({ id: r._id })}
                          className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* FORM */}
        <div className="p-6">
          <article className="border rounded-xl p-6 bg-neutral-900">
            <h3 className="text-xl font-semibold mb-4">➕ Agregar repuesto</h3>

            <form onSubmit={handleAddRepuesto} className="flex flex-col gap-5 text-zinc-300">
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

                {/* Selectores asíncronos */}
                <SelectCategoria
                  valueName={categoria}
                  onPick={(nombre, id) => {
                    setCategoria(nombre);
                    setCategoriaId(id);
                  }}
                />
                <SelectMarca
                  valueName={marca}
                  onPick={(nombre, id) => {
                    setMarca(nombre);
                    setMarcaId(id);
                    // al cambiar marca, limpiar dependientes
                    setVehiculo("");
                    setVehiculoId(undefined);
                    setModeloCompatible("");
                    setModeloId(undefined);
                  }}
                />
                <SelectVehiculo
                  valueName={vehiculo}
                  marcaId={marcaId ?? null}
                  onPick={(nombre, id) => {
                    setVehiculo(nombre);
                    setVehiculoId(id);
                    setModeloCompatible("");
                    setModeloId(undefined);
                  }}
                />
                <SelectModelo
                  valueName={modeloCompatible}
                  marcaId={marcaId ?? null}
                  vehiculoId={vehiculoId ?? null}
                  onPick={(nombre, id) => {
                    setModeloCompatible(nombre);
                    setModeloId(id);
                  }}
                />

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
                  className="px-6 py-2.5 bg-indigo-700 text-white rounded-lg"
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
      <label className="text-sm mb-1 text-neutral-300">{label}</label>
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
      className="border rounded px-3 py-2 text-sm w-full bg-zinc-800 text-white"
    />
  );
}

function Textarea({ value, onChange }: any) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded px-3 py-2 text-sm w-full bg-zinc-800 text-white"
      rows={3}
    />
  );
}
