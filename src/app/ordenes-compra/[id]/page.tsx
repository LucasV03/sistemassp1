'use client';

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { DownloadOcPdfButton } from "../../../components/DownloadOcPdfButton";

// 🔑 Formato moneda argentino
const moneyFmt = (moneda: string) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda || "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function OCDetail() {
  const { id } = useParams<{ id: string }>();
  const data = useQuery(api.ordenesCompra.obtenerConNombres, { id: id as any });

  if (!data)
    return (
      // Fondo principal: Usamos el color oscuro `#0b1618`
      <div className="min-h-screen bg-[#0b1618] text-[#e6f6f7] p-6 flex items-center justify-center">
        Cargando...
      </div>
    );
  const { oc, items } = data;

  const subTot = oc.subtotal;
  const descTot = oc.totalDescuento;
  const grand = oc.totalGeneral;

  return (
    // Fondo principal: Usamos el color oscuro `#0b1618`
    <div className="min-h-screen bg-[#0b1618] text-gray-100 p-6 space-y-6">
      {/* Encabezado de la vista */}
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[#e6f6f7]">Orden de compra</h1>
        {/* El componente DownloadOcPdfButton queda tal cual para no modificar la funcionalidad */}
        <DownloadOcPdfButton oc={oc as any} items={items as any[]} />
      </div>

      {/* Datos principales - Usamos el color de caja/fondo secundario: `#11292e` */}
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-3 border border-[#1e3c42] rounded-xl p-4 bg-[#11292e] shadow-lg">
        <Info label="N° OC" value={oc.numeroOrden} />
        <Info label="Fecha" value={new Date(oc.fechaOrden).toLocaleDateString("es-AR")} />
        <Info label="Estado" value={oc.estado} />
        <Info label="Proveedor" value={oc.proveedorNombre} />
        <Info label="Depósito destino" value={oc.depositoNombre} />
        <Info
          label="Plazo de entrega"
          value={
            oc.fechaEsperada
              ? new Date(oc.fechaEsperada).toLocaleDateString("es-AR")
              : "—"
          }
        />
      </div>

      {/* Tabla de ítems - Usamos el color de caja/fondo secundario: `#11292e` */}
      <div className="max-w-5xl mx-auto rounded-xl border border-[#1e3c42] overflow-hidden bg-[#11292e] shadow-lg">
        <table className="w-full text-sm">
          {/* Encabezado de la tabla ajustado */}
          <thead className="bg-[#1e3c42] text-[#d2e6e9]">
            <tr>
              <th className="p-3 text-left">Cantidad</th>
              <th className="p-3 text-left">Descripción</th>
              <th className="p-3 text-right">Precio unitario</th>
              <th className="p-3 text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any) => {
              const importe =
                it.cantidadPedida *
                it.precioUnitario *
                (1 - (it.descuentoPorc ?? 0) / 100);
              return (
                <tr 
                  key={String(it._id)} 
                  // Borde y hover ajustados a la nueva gama de colores
                  className="border-t border-[#1e3c42] hover:bg-[#1e3c42] transition"
                >
                  <td className="p-3">{it.cantidadPedida}</td>
                  {/* Color de texto para la descripción ajustado */}
                  <td className="p-3 text-gray-300">{it.descripcion}</td> 
                  <td className="p-3 text-right">
                    {moneyFmt(oc.moneda).format(it.precioUnitario)}
                  </td>
                  <td className="p-3 text-right">
                    {moneyFmt(oc.moneda).format(importe)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Pie de tabla (tfoot) ajustado */}
          <tfoot className="bg-[#1e3c42] text-[#d2e6e9]">
            <tr>
              <td colSpan={2} />
              <td className="p-3 text-right font-medium">Subtotal</td>
              <td className="p-3 text-right">{moneyFmt(oc.moneda).format(subTot)}</td>
            </tr>
            <tr>
              <td colSpan={2} />
              <td className="p-3 text-right font-medium">Descuento</td>
              <td className="p-3 text-right">
                {moneyFmt(oc.moneda).format(descTot)}
              </td>
            </tr>
            <tr>
              <td colSpan={2} />
              <td className="p-3 text-right font-semibold">Total</td>
              <td className="p-3 text-right font-semibold">
                {moneyFmt(oc.moneda).format(grand)}
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
      {/* Color de etiqueta ajustado */}
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-sm text-[#e6f6f7]">{value}</div>
    </div>
  );
}