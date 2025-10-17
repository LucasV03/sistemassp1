// app/facturas/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

type OrdenarPor =
  | "nombre"
  | "contacto_principal"
  | "email"
  | "reputacion"
  | "estado"
  | "cuit";

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
    // Fondo principal: Usamos el color oscuro `#0b1618`
    <div className="min-h-screen bg-[#0b1618] text-gray-100 p-6 space-y-6">
      
      {/* HEADER: Sin límites de ancho (se ajusta al p-6 del div padre) */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Proveedores</h1>
        <Link
          href="/proveedores/nuevo"
          className="px-4 py-2 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-semibold shadow-md transition"
        >
          + Nuevo proveedor
        </Link>
      </div>

      {/* Contenedor principal de la lista (ocupa el 100% del ancho disponible) */}
      <div className="overflow-hidden rounded-xl border border-[#1e3c42] bg-[#11292e] shadow-lg">
        
        {/* Barra de filtros */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[#1e3c42]">
          <input
            className="w-80 rounded-lg border border-[#1e3c42] bg-[#1a3035] px-3 py-2 text-sm text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#36b6b0]"
            placeholder="Buscar por nombre, contacto, email o CUIT"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />

          <label className="inline-flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={soloActivos}
              onChange={(e) => setSoloActivos(e.target.checked)}
            />
            <span>Solo activos</span>
          </label>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-300">Ordenar:</span>
            {(["nombre", "contacto_principal", "email", "reputacion", "cuit"] as OrdenarPor[]).map(
              (campo) => (
                <button
                  key={campo}
                  onClick={() => toggleOrden(campo)}
                  className={`rounded-md px-2 py-1 transition ${
                    ordenarPor === campo
                      ? "bg-[#1e3c42] text-white"
                      : "text-gray-400 hover:bg-[#1a3035] hover:text-white"
                  }`}
                >
                  {campo === "contacto_principal"
                    ? "Contacto"
                    : campo[0].toUpperCase() + campo.slice(1)}{" "}
                  {ordenarPor === campo ? (orden === "asc" ? "▲" : "▼") : ""}
                </button>
              )
            )}
          </div>
        </div>
        
        {/* Tabla */}
        <div className="overflow-x-auto"> {/* Asegura que la tabla maneje el scroll si no cabe */}
          <table className="min-w-full divide-y divide-[#1e3c42]">
            <thead className="bg-[#1e3c42] text-gray-300">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Contacto</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Teléfono</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">CUIT</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Código</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                
                <th className="px-4 py-3 text-left text-sm font-medium">Reputación</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3c42]">
              {data.map((p: any) => (
                <tr key={String(p._id)} className="hover:bg-[#1a3035] transition">
                  <td className="px-4 py-2.5 font-medium text-white">{p.nombre}</td>
                  <td className="px-4 py-2.5">{p.contacto_principal}</td>
                  <td className="px-4 py-2.5 text-gray-400">{p.telefono}</td>
                  <td className="px-4 py-2.5 text-gray-400">{p.email}</td>
                  <td className="px-4 py-2.5 text-gray-400">{p.cuit ?? "-"}</td>
                  <td className="px-4 py-2.5 text-gray-400">{p.codigo ?? "-"}</td>

                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.activo
                          ? "bg-emerald-600/20 text-emerald-400"
                          : "bg-gray-600/20 text-gray-400"
                      }`}
                    >
                      {p.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400">
                    {p.reputacion ? `${p.reputacion}/5` : "-"}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2 justify-start">
                      {/* Botón Ver (teal/acento) */}
                      <Link
                        href={`/proveedores/${String(p._id)}`}
                        className="px-3 py-1.5 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white text-xs font-medium transition"
                      >
                        Ver
                      </Link>
                      {/* Botón Editar (teal/acento) */}
                      <Link
                        href={`/proveedores/${String(p._id)}/editar`}
                        className="px-3 py-1.5 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white text-xs font-medium transition"
                      >
                        Editar
                      </Link>
                      {p.activo ? (
                        // Botón Desactivar (Rojo ajustado)
                        <button
                          onClick={() => desactivar({ id: p._id })}
                          className="px-3 py-1.5 rounded-lg bg-red-700/70 hover:bg-red-600/80 text-white text-xs font-medium transition"
                        >
                          Desactivar
                        </button>
                      ) : (
                        // Botón Activar (teal/acento)
                        <button
                          onClick={() => activar({ id: p._id })}
                          className="px-3 py-1.5 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white text-xs font-medium transition"
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
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    Sin resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}