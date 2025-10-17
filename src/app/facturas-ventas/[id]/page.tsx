"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FacturaDetallePage() {
  const router = useRouter();
  const { id } = useParams();
  const factura = useQuery(api.facturas_ventas.listarConCliente)?.find(
    (f: any) => f._id === id
  );

  if (!factura)
    return (
      <div className="min-h-screen bg-[#0d1b1e] flex items-center justify-center text-gray-400">
        Cargando factura...
      </div>
    );

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(n);

  return (
    <div className="min-h-screen bg-[#0d1b1e] text-[#e8f9f9] p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Detalle de Factura</h1>
          <p className="text-[#a8d8d3] text-sm">
            Visualización del comprobante y sus servicios asociados.
          </p>
        </div>
        <Link
          href="/facturas-ventas"
          className="flex items-center gap-2 text-[#36b6b0] hover:text-[#2ca6a4]"
        >
          <ArrowLeft size={18} /> Volver
        </Link>
      </div>

      {/* Cabecera */}
      <div className="bg-[#11292e] border border-[#1e3c42] rounded-2xl p-6 shadow-lg max-w-4xl space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Datos del cliente</h2>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-[#9ed1cd]">Razón social:</span>{" "}
                {factura.clienteRazonSocial}
              </p>
              <p>
                <span className="text-[#9ed1cd]">CUIT:</span>{" "}
                {factura.clienteCuit || "—"}
              </p>
              {factura.clienteAlias && (
                <p>
                  <span className="text-[#9ed1cd]">Alias:</span>{" "}
                  {factura.clienteAlias}
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Comprobante</h2>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-[#9ed1cd]">Tipo:</span>{" "}
                {factura.tipoComprobante.replace("FACTURA_", "Factura ")}
              </p>
              <p>
                <span className="text-[#9ed1cd]">Número:</span> {factura.numero}
              </p>
              <p>
                <span className="text-[#9ed1cd]">Fecha:</span>{" "}
                {new Date(factura.fecha).toLocaleDateString("es-AR")}
              </p>
              <p>
                <span className="text-[#9ed1cd]">Hora:</span>{" "}
                {factura.hora ?? "—"}
              </p>
              <p>
                <span className="text-[#9ed1cd]">Estado:</span>{" "}
                <EstadoPill estado={factura.estado} />
              </p>
            </div>
          </div>
        </div>

        {/* Ítems */}
        <div>
          <h2 className="text-lg font-semibold mt-6 mb-2">Servicios facturados</h2>
          <div className="border border-[#1e3c42] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#1b3a3f] text-[#9ed1cd]">
                <tr>
                  <th className="p-2 text-left">Descripción</th>
                  <th className="p-2 text-right">Cantidad</th>
                  <th className="p-2 text-right">Precio Unitario</th>
                  <th className="p-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {factura.items.map((i: any, idx: number) => (
                  <tr
                    key={idx}
                    className="border-t border-[#1e3c42] hover:bg-[#15393f] transition"
                  >
                    <td className="p-2">{i.descripcion}</td>
                    <td className="p-2 text-right">{i.cantidad}</td>
                    <td className="p-2 text-right">{fmt(i.precioUnitario)}</td>
                    <td className="p-2 text-right">{fmt(i.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales */}
        <div className="bg-[#0f2327] rounded-xl border border-[#1e3c42] p-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{fmt(factura.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>IVA (21%):</span>
            <span>{fmt(factura.iva)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold text-white pt-1">
            <span>Total:</span>
            <span>{fmt(factura.total)}</span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg bg-[#1e3c42] hover:bg-[#2e5d65] text-white transition"
          >
            Volver
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-semibold"
          >
            Imprimir / Exportar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function EstadoPill({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    EMITIDA: "bg-blue-800/30 text-blue-300",
    PAGADA: "bg-green-800/30 text-green-300",
    VENCIDA: "bg-red-800/30 text-red-300",
    PENDIENTE: "bg-yellow-800/30 text-yellow-300",
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${map[estado] ?? ""}`}
    >
      {estado}
    </span>
  );
}
