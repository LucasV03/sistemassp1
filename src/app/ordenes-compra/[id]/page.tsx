'use client';

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { DownloadOcPdfButton } from "../../../components/DownloadOcPdfButton";



export default function OCDetail() {
  const { id } = useParams<{ id: string }>();
  const data = useQuery(api.ordenesCompra.obtenerConNombres, { id: id as any });

  if (!data) return <div className="p-6 text-neutral-300">Cargando...</div>;
  const { oc, items } = data;

  const subTot = oc.subtotal;
  const impTot = oc.totalImpuestos;
  const grand = oc.totalGeneral;

  return (
    <div className="p-6 space-y-6 text-white">
      {/* Encabezado de la vista */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orden de compra</h1>
        {/* Botón de descarga en PDF */}
        <DownloadOcPdfButton oc={oc as any} items={items as any[]} />
      </div>

      {/* Datos principales */}
      <div className="grid md:grid-cols-3 gap-3 border border-neutral-800 rounded p-4 bg-[#0c0c0c]">
        <Info label="N° OC" value={oc.numeroOrden} />
        <Info label="Fecha" value={new Date(oc.fechaOrden).toLocaleDateString()} />
        <Info label="Estado" value={oc.estado} />
        <Info label="Proveedor" value={oc.proveedorNombre} />
        <Info label="Depósito destino" value={oc.depositoNombre} />
        <Info
          label="Plazo de entrega"
          value={
            oc.fechaEsperada
              ? new Date(oc.fechaEsperada).toLocaleDateString()
              : "—"
          }
        />
      </div>

      {/* Tabla de ítems */}
      <div className="rounded border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900">
            <tr>
              <th className="p-2 text-left">Cantidad</th>
              <th className="p-2 text-left">Descripción</th>
              <th className="p-2 text-right">Precio unitario</th>
              <th className="p-2 text-right">Importe</th>
            </tr>
          </thead>
          <tbody className="text-neutral-200">
            {items.map((it: any) => {
              const importe =
                it.cantidadPedida *
                it.precioUnitario *
                (1 - (it.descuentoPorc ?? 0) / 100);
              return (
                <tr key={String(it._id)} className="border-t border-neutral-800">
                  <td className="p-2">{it.cantidadPedida}</td>
                  <td className="p-2">{it.descripcion}</td>
                  <td className="p-2 text-right">{it.precioUnitario.toFixed(2)}</td>
                  <td className="p-2 text-right">{importe.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-neutral-900/50">
            <tr>
              <td colSpan={2} />
              <td className="p-2 text-right font-medium">Subtotal</td>
              <td className="p-2 text-right">{subTot.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={2} />
              <td className="p-2 text-right font-medium">Impuesto</td>
              <td className="p-2 text-right">{impTot.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={2} />
              <td className="p-2 text-right font-semibold">Total</td>
              <td className="p-2 text-right font-semibold">
                {grand.toFixed(2)} {oc.moneda}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="text-sm text-neutral-100">{value}</div>
    </div>
  );
}
