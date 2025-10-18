"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function VerContratoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const contrato = useQuery(api.contratos_servicios.obtener, { id: id as any });
  const cliente = useQuery(
    api.clientes_ventas.obtener as any,
    contrato ? ({ id: contrato.clienteId } as any) : ("skip" as any)
  ) as any;

  if (contrato === undefined)
    return (
      <div className="min-h-screen bg-[#0d1b1e] text-[#e6f6f7] p-6 flex items-center justify-center">
        Cargando contrato…
      </div>
    );
  if (contrato === null)
    return (
      <div className="min-h-screen bg-[#0d1b1e] text-[#e6f6f7] p-6 flex items-center justify-center">
        No se encontró el contrato.
      </div>
    );

  return (
    <main className="min-h-screen bg-[#0d1b1e] text-[#e6f6f7] p-6 space-y-6">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">Contrato de Servicios</h1>
        <Link href="/contratos-servicios" className="px-3 py-1.5 rounded-lg border border-[#2f6368] bg-[#2b5a60] hover:bg-[#2f6368]"> 
          <span className="inline-flex items-center gap-2"><ArrowLeft size={18} /> Volver</span>
        </Link>
      </div>
      <article className="max-w-3xl mx-auto bg-[#11292e] border border-[#1e3c42] rounded-2xl p-6 shadow-sm space-y-3">
        <p><b>Cliente:</b> {cliente ? (cliente.alias || cliente.razonSocial) : (contrato.clienteRazonSocial || "—")}</p>
        <p><b>Tipo:</b> {contrato.tipo}</p>
        <p><b>Tarifa base:</b> {contrato.tarifaBase?.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</p>
        <p><b>Estado:</b> {contrato.estado}</p>
        <p><b>Inicio:</b> {contrato.fechaInicio ?? "—"}</p>
        <p><b>Fin:</b> {contrato.fechaFin ?? "—"}</p>
        {contrato.notas && <p><b>Notas:</b> {contrato.notas}</p>}
      </article>
    </main>
  );
}
