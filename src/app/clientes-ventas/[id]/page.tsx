"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function DetalleClienteVentas() {
  const { id } = useParams<{ id: string }>();
  const cliente = useQuery(api.clientes_ventas.obtener, { id: id as any });
  const contratos = useQuery(api.contratos_servicios.listarConCliente, {}) ?? [];

  if (!cliente)
    return (
      <div className="min-h-screen bg-[#1b3a3f] text-[#e8f9f9] flex items-center justify-center">
        Cargando cliente...
      </div>
    );

  const contratosCliente = contratos.filter((c: any) => c.clienteId === id);

  return (
    <div className="min-h-screen bg-[#1b3a3f] text-[#e8f9f9] p-8 space-y-8">
      {/* 🔹 Encabezado */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {cliente.alias
            ? `${cliente.alias} (${cliente.razonSocial})`
            : cliente.razonSocial}
        </h1>
        <Link
          href="/clientes-ventas"
          className="flex items-center gap-2 text-[#36b6b0] hover:text-[#2ca6a4]"
        >
          <ArrowLeft size={18} /> Volver
        </Link>
      </div>

      {/* 🔹 Ficha de información */}
      <div className="bg-[#24474d] rounded-xl border border-[#2f6368] p-6 grid md:grid-cols-2 gap-3">
        <p><strong>Razón Social:</strong> {cliente.razonSocial}</p>
        {cliente.alias && <p><strong>Alias:</strong> {cliente.alias}</p>}
        <p><strong>CUIT:</strong> {cliente.cuit}</p>
        <p><strong>Teléfono:</strong> {cliente.telefono || "—"}</p>
        <p><strong>Email:</strong> {cliente.email || "—"}</p>
        <p><strong>Dirección:</strong> {cliente.direccion}</p>
        {cliente.ciudad && (
          <p><strong>Ciudad:</strong> {cliente.ciudad}</p>
        )}
        {cliente.provincia && (
          <p><strong>Provincia:</strong> {cliente.provincia}</p>
        )}
        {cliente.codigoPostal && (
          <p><strong>Código Postal:</strong> {cliente.codigoPostal}</p>
        )}
        <p>
          <strong>Estado:</strong>{" "}
          <span
            className={`${
              cliente.estado === "ACTIVO"
                ? "text-teal-400 font-semibold"
                : "text-red-400 font-semibold"
            }`}
          >
            {cliente.estado}
          </span>
        </p>
      </div>

      {/* 🔹 Contratos asociados */}
      <div className="bg-[#24474d] rounded-xl border border-[#2f6368] p-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <FileText size={20} className="text-[#36b6b0]" /> Contratos asociados
        </h2>

        {contratosCliente.length > 0 ? (
          <ul className="divide-y divide-[#2f6368]">
            {contratosCliente.map((c: any) => (
              <li
                key={c._id}
                className="py-3 flex justify-between items-center text-sm"
              >
                <div>
                  <p className="font-semibold text-[#e8f9f9]">
                    {c.tipo} —{" "}
                    <span
                      className={`${
                        c.estado === "VIGENTE"
                          ? "text-teal-400"
                          : c.estado === "FINALIZADO"
                          ? "text-gray-400"
                          : "text-yellow-300"
                      }`}
                    >
                      {c.estado}
                    </span>
                  </p>
                  <p className="text-[#a6d3d1]">
                    Inicio: {c.fechaInicio}{" "}
                    {c.fechaFin && <>• Fin: {c.fechaFin}</>}
                  </p>
                </div>
                <Link
                  href={`/contratos-servicios/${c._id}`}
                  className="text-[#36b6b0] hover:underline font-medium"
                >
                  Ver contrato
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[#b7e2de] text-sm">No hay contratos aún.</p>
        )}
      </div>
    </div>
  );
}
