"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Search } from "lucide-react";

type Props = {
  valueName?: string;
  onPick: (nombre: string, id: string) => void;
};

export default function SelectMarcaVehiculo({ valueName, onPick }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const marcas = useQuery(api.marcas_vehiculos.buscar, { q: busqueda })?.items ?? [];

  return (
    <div className="flex flex-col flex-1 min-w-[220px]">
      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
        Marca del Vehículo
      </label>
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar o seleccionar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
        <Search
          size={18}
          className="absolute right-3 top-2.5 text-neutral-400 dark:text-neutral-500"
        />
      </div>

      {/* Listado de coincidencias */}
      {busqueda && (
        <div className="mt-1 max-h-40 overflow-y-auto border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 shadow-md z-10">
          {marcas.length > 0 ? (
            marcas.map((m) => (
              <button
                key={m._id}
                onClick={() => {
                  onPick(m.nombre, m._id);
                  setBusqueda(m.nombre);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-100"
              >
                {m.nombre}
              </button>
            ))
          ) : (
            <div className="p-3 text-sm text-neutral-500 dark:text-neutral-400">
              No se encontraron marcas.
            </div>
          )}
        </div>
      )}

      {/* Valor seleccionado */}
      {valueName && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Seleccionado: <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{valueName}</span>
        </p>
      )}
    </div>
  );
}
