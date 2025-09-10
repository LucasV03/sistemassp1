"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function ProveedorDetallePage() {
  const params = useParams<{ id: string }>();
  const proveedor = useQuery(api.proveedores.obtener, { id: params.id as any });
  const activar = useMutation(api.proveedores.activar);
  const desactivar = useMutation(api.proveedores.desactivar);

  if (!proveedor) {
    return <div className="p-6 text-gray-300">Cargando...</div>;
  }

  return (
    <div className="p-6 space-y-6 text-gray-100">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{proveedor.nombre}</h1>
        <div className="flex items-center gap-3">
          <Link
            href={`/proveedores/${String(proveedor._id)}/editar`}
            className="rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800"
          >
            Editar
          </Link>

          {proveedor.activo ? (
            <button
              onClick={() => desactivar({ id: proveedor._id })}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-500"
            >
              Desactivar
            </button>
          ) : (
            <button
              onClick={() => activar({ id: proveedor._id })}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500"
            >
              Activar
            </button>
          )}

          <Link href="/proveedores" className="text-gray-300 hover:text-white">
            Volver
          </Link>
        </div>
      </div>

      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
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
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-sm text-gray-100">{value}</div>
    </div>
  );
}
