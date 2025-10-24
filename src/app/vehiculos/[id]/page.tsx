"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { ArrowLeft, Edit3, Truck } from "lucide-react";
import Link from "next/link";
import type { Id } from "@convex/_generated/dataModel";

export default function VehiculoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const vehiculos = useQuery(api.vehiculos.listar, {}) ?? [];
  const marcas = useQuery(api.marcas_vehiculos.listar, {}) ?? [];
  const tipos = useQuery(api.tipos_vehiculo.listar, {}) ?? [];

  const v = vehiculos.find((x: any) => String(x._id) === String(id));
  const marca = marcas.find((m: any) => m._id === v?.marcaVehiculoId);
  const tipo = tipos.find((t: any) => t._id === v?.tipoVehiculoId); // ✅ corregido

  if (!v)
    return (
      <div className="min-h-screen bg-[#0d1b1e] text-[#e6f6f7] flex items-center justify-center">
        Cargando vehículo...
      </div>
    );

  return (
    <main className="min-h-screen bg-[#0d1b1e] text-[#e6f6f7] px-6 py-10 flex flex-col items-center">
      {/* Header */}
      <div className="max-w-2xl w-full mb-6 flex items-center justify-between text-[#36b6b0]">
        <Link
          href="/vehiculos"
          className="flex items-center gap-2 hover:text-[#2ca6a4] transition"
        >
          <ArrowLeft size={20} />
          <span>Volver</span>
        </Link>

        <button
          onClick={() => router.push(`/vehiculos/${String(v._id)}/editar`)}
          className="flex items-center gap-2 bg-[#36b6b0] hover:bg-[#2ca6a4] text-white px-4 py-2 rounded-lg transition"
        >
          <Edit3 size={18} />
          Editar
        </button>
      </div>

      {/* Detalle */}
      <article className="w-full max-w-2xl bg-[#1b3a3f] border border-[#2f6368] rounded-xl shadow-lg p-8 space-y-5">
        <div className="flex items-center gap-3">
          <Truck size={32} className="text-[#36b6b0]" />
          <h1 className="text-3xl font-semibold">{v.nombre}</h1>
        </div>

        <div className="space-y-3 text-[#c2e2e2]">
          <p>
            <strong>Marca:</strong> {marca ? marca.nombre : "Sin marca asignada"}
          </p>
          <p>
            <strong>Tipo:</strong> {tipo ? tipo.nombre : "Sin tipo asignado"}
          </p>
          <p>
            <strong>Patente:</strong> {v.patente || "No registrada"}
          </p>
          <p>
            <strong>Capacidad:</strong> {v.capacidad ?? "No especificada"}
          </p>
          <p>
            <strong>Estado:</strong>{" "}
            <span
              className={`px-2 py-1 rounded ${
                v.estado === "OPERATIVO"
                  ? "bg-emerald-700/30 text-emerald-300"
                  : v.estado === "MANTENIMIENTO"
                  ? "bg-amber-700/30 text-amber-300"
                  : "bg-red-800/30 text-red-300"
              }`}
            >
              {v.estado}
            </span>
          </p>
        </div>
      </article>
    </main>
  );
}
