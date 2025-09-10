// src/app/proveedores/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
// ⬇️ importa el api generado por Convex (ajusta la ruta si tu app está en otra carpeta)
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

type OrdenarPor = "nombre" | "contacto_principal" | "email" | "reputacion" | "estado";

export default function ProveedoresPage() {
  const [buscar, setBuscar] = useState("");
  const [soloActivos, setSoloActivos] = useState(false);
  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor>("nombre");
  const [orden, setOrden] = useState<"asc" | "desc">("asc");

  const proveedores = useQuery(api.proveedores.listar, {
    buscar,
    soloActivos,
    ordenarPor,
    orden,
  });

  const activar = useMutation(api.proveedores.activar);
  const desactivar = useMutation(api.proveedores.desactivar);

  const toggleOrden = (campo: OrdenarPor) => {
    if (ordenarPor === campo) {
      setOrden((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setOrdenarPor(campo);
      setOrden("asc");
    }
  };

  const data = proveedores ?? [];

  return (
    <div className="p-6 space-y-6 text-gray-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Proveedores</h1>
        <Link
          href="/proveedores/nuevo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          + Nuevo proveedor
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="w-80 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="Buscar por nombre, contacto o email"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={soloActivos}
            onChange={(e) => setSoloActivos(e.target.checked)}
          />
          <span>Solo activos</span>
        </label>

        <div className="flex items-center gap-2 text-sm">
          <span>Ordenar:</span>
          {(["nombre", "contacto_principal", "email", "reputacion"] as OrdenarPor[]).map((campo) => (
            <button
              key={campo}
              onClick={() => toggleOrden(campo)}
              className={`rounded-md px-2 py-1 ${
                ordenarPor === campo
                  ? "bg-gray-700 text-gray-100"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {campo === "contacto_principal" ? "Contacto" : campo[0].toUpperCase() + campo.slice(1)}{" "}
              {ordenarPor === campo ? (orden === "asc" ? "▲" : "▼") : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-800">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-900/60 text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Contacto</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Teléfono</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Reputación</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.map((p: any) => (
              <tr key={String(p._id)} className="hover:bg-gray-900/40">
                <td className="px-4 py-3">{p.nombre}</td>
                <td className="px-4 py-3">{p.contacto_principal}</td>
                <td className="px-4 py-3">{p.telefono}</td>
                <td className="px-4 py-3">{p.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      p.activo ? "bg-emerald-600/20 text-emerald-300" : "bg-gray-600/20 text-gray-300"
                    }`}
                  >
                    {p.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">{p.reputacion ? `${p.reputacion}/5` : "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/proveedores/${String(p._id)}`} className="text-blue-400 hover:text-blue-300">
                      Ver
                    </Link>
                    <Link
                      href={`/proveedores/${String(p._id)}/editar`}
                      className="text-yellow-400 hover:text-yellow-300"
                    >
                      Editar
                    </Link>
                    {p.activo ? (
                      <button
                        onClick={() => desactivar({ id: p._id })}
                        className="text-red-400 hover:text-red-300"
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        onClick={() => activar({ id: p._id })}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        Activar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


    </div>
  );
}
