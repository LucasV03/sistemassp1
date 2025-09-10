'use client';

import { useState } from 'react';

type Props = { oc: any; items: any[] };

// 👇 CAMBIO: export nombrado (no default)
export function DownloadOcPdfButton({ oc, items }: Props) {
  const [downloading, setDownloading] = useState(false);

  const money = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: oc?.moneda || 'ARS',
      minimumFractionDigits: 2,
    }).format(n ?? 0);

  const fDate = (d?: string) => (d ? new Date(d).toLocaleDateString('es-AR') : '—');

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const marginX = 40;
      let y = 52;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('ORDEN DE COMPRA', 297.5, y, { align: 'center' });

      y += 24;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      doc.text('Transporte Emanuel', marginX, y);
      doc.text(`Fecha: ${fDate(oc?.fechaOrden)}`, 420, y);

      y += 18;
      doc.text(`N° OC: ${oc?.numeroOrden ?? ''}`, marginX, y);
      doc.text(`Estado: ${oc?.estado ?? ''}`, 420, y);

      y += 18;
      doc.text(`Proveedor: ${oc?.proveedorNombre ?? ''}`, marginX, y);
      doc.text(`Depósito destino: ${oc?.depositoNombre ?? ''}`, 420, y);

      y += 18;
      doc.text(`Plazo de entrega: ${fDate(oc?.fechaEsperada)}`, marginX, y);

      const rows = (items || []).map((it: any) => {
        const importe =
          (it.cantidadPedida ?? 0) *
          (it.precioUnitario ?? 0) *
          (1 - ((it.descuentoPorc ?? 0) / 100));
        return [
          String(it.cantidadPedida ?? ''),
          it.descripcion ?? it.productoNombre ?? '',
          money(it.precioUnitario ?? 0),
          it.descuentoPorc ? `${it.descuentoPorc}%` : '—',
          money(importe),
        ];
      });

      autoTable(doc, {
        startY: y + 12,
        head: [['Cant.', 'Descripción', 'Precio unit.', 'Desc.', 'Importe']],
        body: rows,
        theme: 'grid',
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [240, 240, 240], textColor: 20 },
      });

      const afterTableY =
        // @ts-ignore
        (doc.lastAutoTable?.finalY as number | undefined) ?? y + 120;

      autoTable(doc, {
        startY: afterTableY + 10,
        theme: 'plain',
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 11, cellPadding: 4 },
        columnStyles: { 0: { halign: 'right' }, 1: { halign: 'right' } },
        body: [
          ['Subtotal', money(oc?.subtotal ?? 0)],
          ['Impuestos', money(oc?.totalImpuestos ?? 0)],
          [
            { content: 'Total', styles: { fontStyle: 'bold' } },
            { content: `${money(oc?.totalGeneral ?? 0)} ${oc?.moneda ?? ''}`, styles: { fontStyle: 'bold' } },
          ],
        ],
      });

      const endBlockY =
        // @ts-ignore
        (doc.lastAutoTable?.finalY as number | undefined) ?? afterTableY + 60;

      const lineY = endBlockY + 50;
      doc.line(marginX, lineY, marginX + 200, lineY);
      doc.text('Firma y aclaración', marginX, lineY + 14);

      doc.save(`OC-${oc?.numeroOrden || 'sin-numero'}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="px-3 py-2 text-sm rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
      disabled={downloading}
      title="Descargar PDF"
    >
      {downloading ? 'Generando…' : 'DESCARGAR'}
    </button>
  );
}
