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
    return (
      // Fondo principal: Usamos el color oscuro `#0b1618`
      <div className="min-h-screen bg-[#0b1618] text-[#e6f6f7] p-6 flex items-center justify-center">
        Cargando comprobante…
      </div>
    );
  }

  const { cabecera, detalle } = data;

  return (
    // Fondo principal: Usamos el color oscuro `#0b1618`
    <div className="min-h-screen bg-[#0b1618] text-gray-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[#e6f6f7]">Detalle del Comprobante</h1>
        <button
          onClick={() => router.back()}
          // Botón con color de caja/fondo secundario
          className="px-3 py-2 rounded-lg border border-[#1e3c42] bg-[#11292e] hover:bg-[#1e3c42] transition-colors text-white"
        >
          ← Volver
        </button>
      </div>

      {/* Cabecera - Usamos el color de caja/fondo secundario: `#11292e` */}
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-3 bg-[#11292e] rounded-xl p-4 border border-[#1e3c42] shadow-lg">
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

      {/* Detalle - Usamos el color de caja/fondo secundario: `#11292e` */}
      <div className="max-w-5xl mx-auto rounded-xl border border-[#1e3c42] overflow-hidden bg-[#11292e] shadow-lg">
        <table className="w-full text-sm">
          {/* Encabezado de la tabla, con un color que contraste pero siga la gama oscura */}
          <thead className="bg-[#1e3c42] text-[#d2e6e9]">
            <tr>
              <th className="p-3 text-left">Repuesto</th>
              <th className="p-3 text-right">Cantidad</th>
              <th className="p-3 text-right">Precio Unit.</th>
              <th className="p-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {detalle.map((d) => (
              <tr
                key={d._id}
                // Borde y hover ajustados a la nueva gama de colores
                className="border-t border-[#1e3c42] hover:bg-[#1e3c42] transition"
              >
                <td className="p-3">{d.repuestoNombre ?? "(sin repuesto)"}</td>
                <td className="p-3 text-right">{d.cantidad}</td>
                <td className="p-3 text-right">
                  {d.precioUnitario.toFixed(2)}
                </td>
                <td className="p-3 text-right">{d.subtotal.toFixed(2)}</td>
              </tr>
            ))}
            {detalle.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-400">
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
      {/* Color de etiqueta ligeramente más claro para contraste */}
      <span className="text-sm text-gray-400">{label}</span>
      <span className="font-medium text-[#e6f6f7]">{children}</span>
    </div>
  );
}