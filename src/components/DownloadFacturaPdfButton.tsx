// src/app/components/DownloadFacturaPdfButton.tsx
"use client";

import { useState } from "react";

type Props = { factura: any };

export function DownloadFacturaPdfButton({ factura }: Props) {
  const [downloading, setDownloading] = useState(false);

  const money = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: factura?.moneda || "ARS",
      minimumFractionDigits: 2,
    }).format(n ?? 0);

  const fDate = (d?: string) => (d ? new Date(d).toLocaleDateString("es-AR") : "—");

  const stringify = (v: any) => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const marginX = 40;
      let y = 58;

      // Encabezado
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("FACTURA DE PROVEEDOR", 297.5, y, { align: "center" });

      y += 22;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Transporte Emanuel", marginX, y);
      doc.text(`Fecha de emisión: ${fDate(factura?.fechaEmision)}`, 400, y);

      y += 16;
      doc.text(`N° Factura: ${factura?.numeroProveedor ?? ""}`, marginX, y);
      doc.text(`Estado: ${factura?.estado ?? ""}`, 400, y);

      y += 16;
      doc.text(`Proveedor: ${factura?.proveedorNombre ?? ""}`, marginX, y);
      doc.text(`Moneda: ${factura?.moneda ?? "ARS"}`, 400, y);

      y += 16;
      doc.text(`Vencimiento: ${fDate(factura?.fechaVencimiento)}`, marginX, y);

      // Bloque totales
      autoTable(doc, {
        startY: y + 12,
        theme: "plain",
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 11, cellPadding: 4 },
        columnStyles: { 0: { halign: "right" }, 1: { halign: "right" } },
        body: [
          ["Subtotal", money(factura?.subtotal ?? 0)],
          ["Impuestos", money(factura?.totalImpuestos ?? 0)],
          [
            { content: "Total", styles: { fontStyle: "bold" } },
            { content: `${money(factura?.total ?? factura?.totalGeneral ?? 0)} ${factura?.moneda ?? ""}`, styles: { fontStyle: "bold" } },
          ],
          [
            { content: "Saldo", styles: { fontStyle: "bold" } },
            { content: `${money(factura?.saldo ?? 0)} ${factura?.moneda ?? ""}`, styles: { fontStyle: "bold" } },
          ],
        ],
      });

      let afterTotals =
        // @ts-ignore
        (doc.lastAutoTable?.finalY as number | undefined) ?? y + 80;

      // Notas (si hay)
      if (factura?.notas) {
        autoTable(doc, {
          startY: afterTotals + 12,
          theme: "plain",
          margin: { left: marginX, right: marginX },
          styles: { fontSize: 11, cellPadding: 6 },
          columnStyles: { 0: { cellWidth: 500 } },
          head: [["Notas"]],
          body: [[String(factura.notas || "")]],
          headStyles: { fillColor: [240, 240, 240], textColor: 20 },
        });
        // @ts-ignore
        afterTotals = doc.lastAutoTable?.finalY ?? (afterTotals + 60);
      }

      // Si existiera una colección de pagos u otros arrays, los volcamos como tabla
      // Intento genérico: si factura.pagos es array => tabla de pagos
      const pagos = Array.isArray(factura?.pagos) ? factura.pagos : undefined;
      if (pagos && pagos.length) {
        const rows = pagos.map((p: any) => [
          fDate(p?.fechaPago),
          p?.medio ?? "—",
          money(p?.importe ?? 0),
          p?.referencia ?? "—",
          p?.notas ?? "—",
        ]);
        autoTable(doc, {
          startY: afterTotals + 12,
          theme: "grid",
          margin: { left: marginX, right: marginX },
          styles: { fontSize: 10, cellPadding: 6 },
          headStyles: { fillColor: [240, 240, 240], textColor: 20 },
          head: [["Fecha", "Medio", "Importe", "Referencia", "Notas"]],
          body: rows,
        });
        // @ts-ignore
        afterTotals = doc.lastAutoTable?.finalY ?? (afterTotals + 120);
      }

      // Línea de firma
      const lineY = afterTotals + 46;
      doc.line(marginX, lineY, marginX + 200, lineY);
      doc.text("Firma y aclaración", marginX, lineY + 14);

      // ---------------------------
      // PÁGINA 2: "Todos los campos"
      // ---------------------------
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("ANEXO: DATOS COMPLETOS DE LA FACTURA", marginX, 60);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const entries: Array<[string, string]> = [];
      Object.keys(factura ?? {}).forEach((k) => {
        // Evita funciones u objetos gigantes con referencias circulares
        const v = factura[k];
        entries.push([k, stringify(v)]);
      });

      // Por si hay demasiadas líneas, usamos autoTable con wrap
      autoTable(doc, {
        startY: 80,
        theme: "grid",
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak" },
        headStyles: { fillColor: [240, 240, 240], textColor: 20 },
        columnStyles: { 0: { cellWidth: 160, fontStyle: "bold" }, 1: { cellWidth: 340 } },
        head: [["Campo", "Valor"]],
        body: entries,
      });

      const fileNameSafe =
        (factura?.numeroProveedor && String(factura.numeroProveedor).replace(/[^\w\-]+/g, "_")) ||
        (factura?._id && String(factura._id)) ||
        "factura";

      doc.save(`FACTURA-${fileNameSafe}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60"
      disabled={downloading}
      title="Descargar factura en PDF"
    >
      {downloading ? "Generando…" : "DESCARGAR FACTURA"}
    </button>
  );
}
