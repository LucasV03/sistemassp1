"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import SelectMarca from "@/components/selectores/SelectMarca";
import SelectVehiculo from "@/components/selectores/SelectVehiculo";

export default function ModelosPage() {
  const [marcaNombre, setMarcaNombre] = useState("");
  const [marcaId, setMarcaId] = useState<string | undefined>(undefined);

  const [vehiculoNombre, setVehiculoNombre] = useState("");
  const [vehiculoId, setVehiculoId] = useState<string | undefined>(undefined);

  const [q, setQ] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");

  const res = useQuery(api.modelos.buscar, {
    q,
    limit: 100,
    cursor: undefined,
    marcaId: marcaId ? (marcaId as any) : undefined,
    vehiculoId: vehiculoId ? (vehiculoId as any) : undefined,
  });
  const items = res?.items ?? [];

  const crear = useMutation(api.modelos.crear);
  const eliminar = useMutation(api.modelos.eliminar);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !marcaId || !vehiculoId) return;
    await crear({
      nombre: nuevoNombre.trim(),
      marcaId: marcaId as any,
      vehiculoId: vehiculoId as any,
    });
    setNuevoNombre("");
  };

  return (
    <main className="p-6 max-w-4xl mx-auto text-white">
      <h1 className="text-2xl font-semibold mb-4">🧩 Modelos</h1>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <SelectMarca
          valueName={marcaNombre}
          onPick={(nombre, id) => {
            setMarcaNombre(nombre);
            setMarcaId(id);
            setVehiculoNombre("");
            setVehiculoId(undefined);
          }}
        />
        <SelectVehiculo
          valueName={vehiculoNombre}
          marcaId={marcaId ?? null}
          onPick={(nombre, id) => {
            setVehiculoNombre(nombre);
            setVehiculoId(id);
          }}
        />
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-sm mb-1 block text-neutral-300">Buscar</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar modelo…"
              className="px-3 py-2 text-sm rounded border border-neutral-700 bg-zinc-900 w-full"
            />
          </div>
          {q && (
            <button
              onClick={() => setQ("")}
              className="px-3 h-9 mt-6 text-sm rounded border border-neutral-600 bg-neutral-800 hover:bg-neutral-700"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="rounded border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900">
            <tr>
              <th className="p-3 text-left">Modelo</th>
              <th className="p-3 text-left">Vehículo</th>
              <th className="p-3 text-left">Marca</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any) => (
              <tr key={String(it._id)} className="border-t border-neutral-800">
                <td className="p-3">{it.nombre}</td>
                <td className="p-3">{vehiculoNombre || "—"}</td>
                <td className="p-3">{marcaNombre || "—"}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => eliminar({ id: it._id })}
                    className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-4 text-neutral-400" colSpan={4}>
                  {!marcaId || !vehiculoId
                    ? "Elegí marca y vehículo para ver/crear modelos."
                    : q
                    ? "Sin coincidencias."
                    : "No hay modelos cargados para esa combinación."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleCrear} className="mt-6 grid md:grid-cols-3 gap-2">
        <input
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          placeholder="Nuevo modelo"
          className="px-3 py-2 text-sm rounded border border-neutral-700 bg-zinc-900 md:col-span-2"
        />
        <button
          disabled={!marcaId || !vehiculoId}
          className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
        >
          Crear
        </button>
      </form>
    </main>
  );
}
