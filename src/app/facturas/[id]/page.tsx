"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function ComprobanteDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const comprobanteId = params.id as Id<"comprobantes_prov">;

  // Ahora `obtener` devuelve proveedorNombre y repuestoNombre
  const data = useQuery(api.comprobantes_prov.obtener, { id: comprobanteId });

  if (!data) {
    return <div className="p-6 text-neutral-300">Cargando comprobante…</div>;
  }

  const { cabecera, detalle } = data;

  return (
    <div className="p-6 space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Detalle del Comprobante</h1>
        <button
          onClick={() => router.back()}
          className="px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
        >
          ← Volver
        </button>
      </div>

      {/* Cabecera */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 bg-neutral-900 rounded p-4 border border-neutral-700">
        <Field label="Tipo">{cabecera.letra}</Field>
        <Field label="Sucursal">{cabecera.sucursal}</Field>
        <Field label="Número">{cabecera.numero}</Field>
        <Field label="Proveedor">
          {cabecera.proveedorNombre ?? "(sin nombre)"}
        </Field>
        <Field label="Fecha">
          {new Date(cabecera.fecha).toLocaleDateString("es-AR")}
        </Field>
        <Field label="Hora">{cabecera.hora}</Field>
        <Field label="Estado">{cabecera.estado}</Field>
        <Field label="Total">${cabecera.total?.toFixed(2)}</Field>
        <Field label="Saldo">${cabecera.saldo?.toFixed(2)}</Field>
      </div>

      {/* Detalle */}
      <div className="rounded border border-neutral-800 overflow-hidden bg-[#0c0c0c]">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-100">
            <tr>
              <th className="p-2 text-left">Repuesto</th>
              <th className="p-2 text-right">Cantidad</th>
              <th className="p-2 text-right">Precio Unit.</th>
              <th className="p-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {detalle.map((d) => (
              <tr key={d._id} className="border-t border-neutral-800">
                <td className="p-2">{d.repuestoNombre ?? "(sin repuesto)"}</td>
                <td className="p-2 text-right">{d.cantidad}</td>
                <td className="p-2 text-right">
                  {d.precioUnitario.toFixed(2)}
                </td>
                <td className="p-2 text-right">{d.subtotal.toFixed(2)}</td>
              </tr>
            ))}
            {detalle.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-neutral-400">
                  No hay ítems cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- helper para cabecera ---------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-neutral-400">{label}</span>
      <span className="font-medium text-neutral-100">{children}</span>
    </div>
  );
}
