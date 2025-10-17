"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { ArrowLeft, FileText, User } from "lucide-react";

// Colores de la estética:
// Fondo: #f8fafa (claro) / #0b1618 (oscuro) -> Usaremos el oscuro #0b1618 o similar para el detalle
// Elementos de fondo: white (claro) / #11292e (oscuro)
// Borde: #e1efef (claro) / #1e3c42 (oscuro)
// Título/Texto primario: #1a3b47 (claro) / #e6f6f7 (oscuro)
// Acento: #36b6b0 (teal/turquesa)

export default function DetalleClienteVentas() {
  const { id } = useParams<{ id: string }>();
  // Usamos api.clientes_ventas.obtener para obtener los datos del cliente, asegurando el tipo.
  const cliente = useQuery(api.clientes_ventas.obtener, { id: id as any });
  // Usamos api.contratos_servicios.listarConCliente, pero la lista está vacía en este fragmento.
  // Asumo que el objetivo es solo estilizar. Mantengo la lógica de carga.
  const contratos = useQuery(api.contratos_servicios.listarConCliente, {}) ?? [];

  if (!cliente)
    return (
      // Fondo oscuro principal del layout
      <div className="min-h-screen bg-[#0b1618] text-[#e6f6f7] flex items-center justify-center">
        Cargando cliente...
      </div>
    );

  const contratosCliente = contratos.filter((c: any) => c.clienteId === id);

  return (
    // Fondo oscuro principal
    <div className="min-h-screen bg-[#0b1618] p-6 transition-colors">
      {/* 🔹 Encabezado */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#e6f6f7]">
          {cliente.alias
            ? `${cliente.alias} (${cliente.razonSocial})`
            : cliente.razonSocial}
        </h1>
        {/* Enlace de Volver con estilo de acento */}
        <Link
          href="/clientes-ventas"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#36b6b0] hover:text-[#2ca6a4] font-medium transition border border-[#36b6b0] hover:border-[#2ca6a4]"
        >
          <ArrowLeft size={18} /> Volver
        </Link>
      </div>

      {/* 🔹 Ficha de información */}
      {/* Contenedor oscuro, borde y sombra sutil */}
      <div className="bg-[#11292e] rounded-2xl shadow-md border border-[#1e3c42] p-6 mb-8 transition-all">
        <h2 className="text-xl font-bold text-[#e8f8f8] mb-4 flex items-center gap-2">
          <User size={22} className="text-[#36b6b0]" /> Información del Cliente
        </h2>
        <div className="grid md:grid-cols-2 gap-y-3 gap-x-6 text-[#d6f4f4]">
          <p>
            <strong className="text-[#9ed1cd] font-semibold">Razón Social:</strong> {cliente.razonSocial}
          </p>
          {cliente.alias && (
            <p>
              <strong className="text-[#9ed1cd] font-semibold">Alias:</strong> {cliente.alias}
            </p>
          )}
          <p>
            <strong className="text-[#9ed1cd] font-semibold">CUIT:</strong> {cliente.cuit}
          </p>
          <p>
            <strong className="text-[#9ed1cd] font-semibold">Teléfono:</strong> {cliente.telefono || "—"}
          </p>
          <p>
            <strong className="text-[#9ed1cd] font-semibold">Email:</strong> {cliente.email || "—"}
          </p>
          <p>
            <strong className="text-[#9ed1cd] font-semibold">Dirección:</strong> {cliente.direccion}
          </p>
          {cliente.ciudad && (
            <p>
              <strong className="text-[#9ed1cd] font-semibold">Ciudad:</strong> {cliente.ciudad}
            </p>
          )}
          {cliente.provincia && (
            <p>
              <strong className="text-[#9ed1cd] font-semibold">Provincia:</strong> {cliente.provincia}
            </p>
          )}
          {cliente.codigoPostal && (
            <p>
              <strong className="text-[#9ed1cd] font-semibold">Código Postal:</strong>{" "}
              {cliente.codigoPostal}
            </p>
          )}
          <p>
            <strong className="text-[#9ed1cd] font-semibold">Estado:</strong>{" "}
            {/* Uso el componente `Estado` o su lógica para mantener la consistencia */}
            <Estado estado={cliente.estado} />
          </p>
        </div>
      </div>

      {/* 🔹 Contratos asociados */}
      {/* Contenedor oscuro, borde y sombra sutil */}
      <div className="bg-[#11292e] rounded-2xl shadow-md border border-[#1e3c42] p-6 transition-all">
        <h2 className="text-xl font-bold text-[#e8f8f8] mb-4 flex items-center gap-2">
          <FileText size={22} className="text-[#36b6b0]" /> Contratos asociados
        </h2>

        {contratosCliente.length > 0 ? (
          // Usamos la estética de la tabla para la lista
          <ul className="divide-y divide-[#1e3c42]">
            {contratosCliente.map((c: any) => (
              <li
                key={c._id}
                className="py-4 flex justify-between items-center text-sm hover:bg-[#15393f] transition px-2 -mx-2 rounded"
              >
                <div>
                  <p className="font-medium text-[#d6f4f4] mb-1">
                    {c.tipo}
                  </p>
                  <p className="text-[#9ed1cd] text-xs">
                    Inicio: {c.fechaInicio}{" "}
                    {c.fechaFin && <>• Fin: {c.fechaFin}</>}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Estado del contrato con estética similar a `Estado` */}
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      c.estado === "VIGENTE"
                        ? "bg-green-800/30 text-green-300"
                        : c.estado === "FINALIZADO"
                        ? "bg-gray-800/30 text-gray-400"
                        : "bg-yellow-800/30 text-yellow-300"
                    }`}
                  >
                    {c.estado}
                  </span>
                  {/* Enlace con estilo de acento */}
                  <Link
                    href={`/contratos-servicios/${c._id}`}
                    className="text-[#36b6b0] hover:text-[#2ca6a4] font-medium transition"
                  >
                    Ver contrato
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[#9ed1cd] text-sm py-4">
            No hay contratos asociados a este cliente aún.
          </p>
        )}
      </div>
    </div>
  );
}

/* === COMPONENTES AUXILIARES COPIADOS Y ADAPTADOS === */

function Estado({ estado }: { estado: string }) {
  const map: any = {
    ACTIVO:
      "bg-green-800/30 text-green-300", // Adaptado para fondo oscuro
    INACTIVO:
      "bg-red-800/30 text-red-300", // Adaptado para fondo oscuro
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full ${
        map[estado] ?? "bg-gray-800/30 text-gray-400"
      }`}
    >
      {estado}
    </span>
  );
}