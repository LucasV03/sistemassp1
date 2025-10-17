"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export default function ComprobanteDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const comprobanteId = params.id as Id<"comprobantes_prov">;

  // 📄 Cabecera y detalle del comprobante
  const data = useQuery(api.comprobantes_prov.obtener, { id: comprobanteId });

  // 💰 Pagos asociados a esta factura (usa facturasIds[])
  const pagos =
    useQuery(api.pagos_comprobantes.listarPorFactura, {
      facturaId: comprobanteId,
    }) ?? [];

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0b1618] text-[#e6f6f7] p-6 flex items-center justify-center">
        Cargando comprobante…
      </div>
    );
  }

  const { cabecera, detalle } = data;

  return (
    <div className="min-h-screen bg-[#0b1618] text-gray-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[#e6f6f7]">
          Detalle del Comprobante
        </h1>
        <button
          onClick={() => router.back()}
          className="px-3 py-2 rounded-lg border border-[#1e3c42] bg-[#11292e] hover:bg-[#1e3c42] transition-colors text-white"
        >
          ← Volver
        </button>
      </div>

      {/* Cabecera */}
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
        <Field label="Total">
          {cabecera.total?.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
          })}
        </Field>
        <Field label="Saldo">
          {cabecera.saldo?.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
          })}
        </Field>
      </div>

      {/* === Resumen de pagos por método === */}
      <div className="max-w-5xl mx-auto bg-[#11292e] border border-[#1e3c42] rounded-xl p-4 text-sm shadow-lg">
        <h3 className="font-semibold mb-2 text-[#9ed1cd]">Pagos por método</h3>
        {["EFECTIVO", "TRANSFERENCIA", "CHEQUE", "TARJETA", "OTRO"].map(
          (medio) => {
            const pagosMetodo = pagos
              .filter((p: any) => p.medio === medio)
              .reduce((a: number, b: any) => a + b.importe, 0);

            const refs = pagos
              .filter((p: any) => p.medio === medio && p.referencia)
              .map((p: any) => p.referencia)
              .join(", ");

            return (
              <div key={medio} className="flex justify-between py-0.5">
                <span>{medio}</span>
                <span>
                  {pagosMetodo.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  })}{" "}
                  {refs && (
                    <span className="text-xs text-gray-400">({refs})</span>
                  )}
                </span>
              </div>
            );
          }
        )}
      </div>

      {/* Detalle de ítems */}
      <div className="max-w-5xl mx-auto rounded-xl border border-[#1e3c42] overflow-hidden bg-[#11292e] shadow-lg">
        <table className="w-full text-sm">
          <thead className="bg-[#1e3c42] text-[#d2e6e9]">
            <tr>
              <th className="p-3 text-left">Repuesto</th>
              <th className="p-3 text-right">Cantidad</th>
              <th className="p-3 text-right">Precio Unit.</th>
              <th className="p-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {detalle.map((d: any) => (
              <tr
                key={d._id}
                className="border-t border-[#1e3c42] hover:bg-[#1e3c42] transition"
              >
                <td className="p-3">{d.repuestoNombre ?? "(sin repuesto)"}</td>
                <td className="p-3 text-right">{d.cantidad}</td>
                <td className="p-3 text-right">
                  {d.precioUnitario.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  })}
                </td>
                <td className="p-3 text-right">
                  {d.subtotal.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  })}
                </td>
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

/* ---------- helper para campos de cabecera ---------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="font-medium text-[#e6f6f7]">{children}</span>
    </div>
  );
}
