"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function ProveedorDetallePage() {
  const params = useParams<{ id: string }>();
  const proveedor = useQuery(api.proveedores.obtener, { id: params.id as any });
  const activar = useMutation(api.proveedores.activar);
  const desactivar = useMutation(api.proveedores.desactivar);

  if (!proveedor) {
    return (
      // Fondo principal: Usamos el color oscuro `#0b1618`
      <div className="min-h-screen bg-[#0b1618] text-[#e6f6f7] p-6 flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  return (
    // Fondo principal: Usamos el color oscuro `#0b1618`
    <div className="min-h-screen bg-[#0b1618] text-gray-100 p-6 space-y-6">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#e6f6f7]">{proveedor.nombre}</h1>
        <div className="flex items-center gap-3">
          {/* Botón Editar - mantiene el color de acento teal */}
          <Link
            href={`/proveedores/${String(proveedor._id)}/editar`}
            className="px-3 py-1.5 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white text-xs font-medium transition"
          >
            Editar
          </Link>

          {/* Botones Activar/Desactivar */}
          {proveedor.activo ? (
            <button
              onClick={() => desactivar({ id: proveedor._id })}
              className="px-3 py-1.5 rounded-lg bg-red-700/70 hover:bg-red-600/80 text-white text-xs font-medium transition"
            >
              Desactivar
            </button>
          ) : (
            <button
              onClick={() => activar({ id: proveedor._id })}
              className="px-3 py-1.5 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white text-xs font-medium transition"
            >
              Activar
            </button>
          )}

          {/* Botón Volver - Usamos el estilo de caja/fondo secundario para coherencia */}
          <Link 
            href="/proveedores" 
            className="px-3 py-1.5 rounded-lg border border-[#1e3c42] bg-[#11292e] hover:bg-[#1e3c42] text-white text-xs font-medium transition"
          >
            Volver
          </Link>
        </div>
      </div>

      {/* Contenedor principal de la información - Usamos el color de caja/fondo secundario: `#11292e` */}
      <div className="max-w-4xl mx-auto bg-[#11292e] border border-[#1e3c42] rounded-xl p-6 shadow-lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Info label="Contacto" value={proveedor.contacto_principal} />
          <Info label="Teléfono" value={proveedor.telefono} />
          <Info label="Email" value={proveedor.email} />
          <Info label="Dirección" value={proveedor.direccion} />
          <Info label="CUIT" value={proveedor.cuit ?? "-"} />
          <Info label="Estado" value={proveedor.activo ? "Activo" : "Inactivo"} />
          <Info
            label="Reputación"
            value={proveedor.reputacion ? `${proveedor.reputacion}/5` : "-"}
          />
          <div className="sm:col-span-2">
            <Info label="Notas" value={proveedor.notas ?? "-"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      {/* Color de etiqueta ajustado */}
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      {/* Color de valor ajustado para contraste */}
      <div className="text-sm text-[#e6f6f7]">{value}</div>
    </div>
  );
}