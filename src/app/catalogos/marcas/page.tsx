"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function MarcasPage() {
  const [q, setQ] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");

  const res = useQuery(api.marcas.buscar, { q, limit: 100, cursor: undefined });
  const items = res?.items ?? [];

  const crear = useMutation(api.marcas.crear);
  const eliminar = useMutation(api.marcas.eliminar);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    await crear({ nombre: nuevoNombre.trim() });
    setNuevoNombre("");
  };

  return (
    <main className="p-6 max-w-3xl mx-auto text-white">
      <h1 className="text-2xl font-semibold mb-4">🏷️ Marcas</h1>

      <div className="flex items-center gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar marca…"
          className="px-3 py-2 text-sm rounded border border-neutral-700 bg-zinc-900"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="px-3 py-2 text-sm rounded border border-neutral-600 bg-neutral-800 hover:bg-neutral-700"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="rounded border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900">
            <tr>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any) => (
              <tr key={String(it._id)} className="border-t border-neutral-800">
                <td className="p-3">{it.nombre}</td>
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
                <td className="p-4 text-neutral-400" colSpan={2}>
                  {q ? "Sin coincidencias." : "Aún no hay marcas."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleCrear} className="mt-6 flex gap-2">
        <input
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          placeholder="Nueva marca"
          className="px-3 py-2 text-sm rounded border border-neutral-700 bg-zinc-900 flex-1"
        />
        <button className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500">
          Crear
        </button>
      </form>
    </main>
  );
}
