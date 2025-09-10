// src/app/proveedores/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function ProveedorDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const proveedor = useQuery(api.proveedores.obtener, { id: params.id as any });
  const repuestos = useQuery(api.repuestos.listar, {}); // trae todos
  const activar = useMutation(api.proveedores.activar);
  const desactivar = useMutation(api.proveedores.desactivar);

  if (!proveedor || !repuestos) {
    return <div className="p-6 text-gray-300">Cargando...</div>;
  }

  // Indexar repuestos por _id para resolver nombre/otros campos
  const repById = new Map(repuestos.map((r) => [String(r._id), r]));

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
        <Info label="Estado" value={proveedor.activo ? "Activo" : "Inactivo"} />
        <Info
          label="Reputación"
          value={proveedor.reputacion ? `${proveedor.reputacion}/5` : "-"}
        />
        <div className="sm:col-span-2">
          <Info label="Notas" value={proveedor.notas ?? "-"} />
        </div>
      </div>

      <div className="max-w-3xl">
        <h2 className="mb-2 text-lg font-medium">Repuestos ofrecidos</h2>
        {proveedor.productos_ofrecidos.length === 0 ? (
          <p className="text-sm text-gray-400">Sin repuestos asociados.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-300">
            {proveedor.productos_ofrecidos.map((rid: any) => {
              const rep = repById.get(String(rid));
              return (
                <li key={String(rid)}>
                  {rep ? (
                    <>
                      <span className="font-medium">{rep.nombre}</span>
                      <span className="text-gray-400">
                        {" "}
                        — {rep.categoria} · {rep.vehiculo} · {rep.codigo}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400">{String(rid)}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
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
