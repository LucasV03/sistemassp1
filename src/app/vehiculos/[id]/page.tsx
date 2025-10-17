"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function VehiculoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const vehiculos = useQuery(api.vehiculos.listar, {}) ?? [];
  const v = vehiculos.find((x: any) => String(x._id) === String(id));

  if (!vehiculos)
    return (
      <div className="min-h-screen bg-[#0d1b1e] text-[#e6f6f7] p-6 flex items-center justify-center">
        Cargando vehículo…
      </div>
    );

  if (!v)
    return (
      <div className="min-h-screen bg-[#0d1b1e] text-[#e6f6f7] p-6 flex items-center justify-center">
        No se encontró el vehículo.
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0d1b1e] text-[#e6f6f7] p-6 space-y-6">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">{v.nombre}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="px-3 py-1.5 rounded-lg border border-[#2f6368] bg-[#2b5a60] hover:bg-[#2f6368]"
          >
            ← Volver
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-[#24474d] border border-[#2f6368] rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Info label="Marca" value={v.marcaNombre ?? "—"} />
          <Info label="Patente" value={v.patente ?? "—"} />
          <Info label="Tipo" value={v.tipo ?? "—"} />
          <Info label="Capacidad" value={v.capacidad ? `${v.capacidad} kg` : "—"} />
          <Info label="Estado" value={v.estado ?? "—"} />
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-[#a8d8d3]">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
