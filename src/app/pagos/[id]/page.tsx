"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export default function PagoDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pagoId = params.id as Id<"pagos_comprobantes">;

  // 🔹 Obtener pago con facturas vinculadas
  const pago = useQuery(api.pagos_comprobantes.obtener, { id: pagoId });

  if (!pago)
    return (
      <div className="min-h-screen bg-[#0b1618] text-[#e6f6f7] flex items-center justify-center">
        Cargando pago…
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0b1618] text-gray-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[#e6f6f7]">
          Detalle del Pago
        </h1>
        <button
          onClick={() => router.back()}
          className="px-3 py-2 rounded-lg border border-[#1e3c42] bg-[#11292e] hover:bg-[#1e3c42] transition-colors text-white"
        >
          ← Volver
        </button>
      </div>

      {/* 🧾 Cabecera del pago */}
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-3 bg-[#11292e] rounded-xl p-4 border border-[#1e3c42] shadow-lg">
        <Field label="Proveedor">{pago.proveedorNombre ?? "—"}</Field>
        <Field label="Fecha">
          {new Date(pago.fechaPago).toLocaleDateString("es-AR")}
        </Field>
        <Field label="Hora">
          {new Date(pago.fechaPago).toLocaleTimeString("es-AR")}
        </Field>
        <Field label="Medio">{pago.medio}</Field>
        <Field label="Referencia">{pago.referencia ?? "—"}</Field>
        <Field label="Importe">
          {pago.importe.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
          })}
        </Field>
        <Field label="Notas">{pago.notas ?? "—"}</Field>
      </div>

      {/* 📦 Facturas asociadas */}
      <div className="max-w-5xl mx-auto bg-[#11292e] border border-[#1e3c42] rounded-xl p-4 text-sm shadow-lg">
        <h3 className="font-semibold mb-2 text-[#9ed1cd]">Facturas asociadas</h3>
        <table className="w-full text-sm">
          <thead className="bg-[#1e3c42] text-[#d2e6e9]">
            <tr>
              <th className="p-3 text-left">Comprobante</th>
              <th className="p-3 text-left">Proveedor</th>
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            {pago.facturas && pago.facturas.length > 0 ? (
              pago.facturas.map((f: any) => (
                <tr
                  key={f._id}
                  className="border-t border-[#1e3c42] hover:bg-[#1e3c42] transition"
                >
                  <td className="p-3">
                    {f.letra}-{f.sucursal}-{f.numero}
                  </td>
                  <td className="p-3">{f.proveedorNombre ?? "—"}</td>
                  <td className="p-3">
                    {new Date(f.fecha).toLocaleDateString("es-AR")}
                  </td>
                  <td className="p-3 text-right">
                    {f.total.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-400">
                  No hay facturas vinculadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🧮 Resumen por método */}
      <div className="max-w-5xl mx-auto bg-[#11292e] border border-[#1e3c42] rounded-xl p-4 text-sm shadow-lg">
        <h3 className="font-semibold mb-2 text-[#9ed1cd]">Resumen por método</h3>
        {["EFECTIVO", "TRANSFERENCIA", "CHEQUE", "TARJETA", "OTRO"].map((medio) => {
          const pagosMetodo =
            pago.medio === medio ? pago.importe : 0;

          return (
            <div key={medio} className="flex justify-between py-0.5">
              <span>{medio}</span>
              <span>
                {pagosMetodo.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- helper ---------- */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="font-medium text-[#e6f6f7]">{children}</span>
    </div>
  );
}
