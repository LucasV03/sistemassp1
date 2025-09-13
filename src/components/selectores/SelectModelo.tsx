"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useDebounce } from "@/lib/useDebounce";

type Props = {
  label?: string;
  valueName: string;
  onPick: (nombre: string, id?: string) => void;
  placeholder?: string;
  autoCreate?: boolean;
  marcaId?: string | null;
  vehiculoId?: string | null;
};

export default function SelectModelo({
  label = "Modelo compatible",
  valueName,
  onPick,
  placeholder = "Buscar/crear modelo...",
  autoCreate = true,
  marcaId = null,
  vehiculoId = null,
}: Props) {
  const [q, setQ] = useState(valueName ?? "");
  const debounced = useDebounce(q, 250);

  const data = useQuery(api.modelos.buscar, {
    q: debounced,
    limit: 20,
    cursor: undefined,
    marcaId: marcaId ? (marcaId as any) : undefined,
    vehiculoId: vehiculoId ? (vehiculoId as any) : undefined,
  });
  const resultados = data?.items ?? [];

  const crear = useMutation(api.modelos.crear);

  const canCreate =
    autoCreate &&
    !!marcaId &&
    !!vehiculoId &&
    q.trim().length > 1 &&
    !resultados.some((r: any) => r.nombre.toLowerCase() === q.trim().toLowerCase());

  return (
    <div className="flex flex-col flex-1 min-w-[220px]">
      <label className="text-sm mb-1 text-neutral-300">{label}</label>
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="border rounded px-3 py-2 text-sm w-full bg-zinc-800 text-white"
        />

        {(q && (resultados.length > 0 || canCreate)) && (
          <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded border border-neutral-700 bg-neutral-900 shadow">
            {resultados.map((it: any) => (
              <button
                key={it._id as string}
                type="button"
                onClick={() => {
                  onPick(it.nombre, it._id as string);
                  setQ(it.nombre);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800"
              >
                {it.nombre}
              </button>
            ))}

            {canCreate && (
              <button
                type="button"
                onClick={async () => {
                  const id = await crear({
                    nombre: q.trim(),
                    marcaId: marcaId as any,
                    vehiculoId: vehiculoId as any,
                  });
                  onPick(q.trim(), id as unknown as string);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-indigo-300"
              >
                + Crear “{q.trim()}”
              </button>
            )}

            {(!marcaId || !vehiculoId) && (
              <div className="px-3 py-2 text-xs text-neutral-400">
                (Seleccioná marca y vehículo para crear un modelo)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
