import { jsPDF } from "jspdf";

type Point = { x: number; y: number };

export type ReportData = {
  balance: { fecha: string; ingresos: number; egresos: number; neto: number }[];
  gastos: { nombre: string; valor: number }[];
  rutas: { ruta: string; kmPromedio: number }[];
  ranking: { nombre: string; viajes: number; km: number }[];
  rankingMetric: "viajes" | "km";
  ingresosCliente: { nombre: string; valor: number }[];
  heatmap?: { matrix: number[][]; max: number };
  meta?: { fecha: string };
};

export async function generarReporteTransportePDF(d: ReportData) {
  const pdf = new jsPDF("p", "pt", "a4");
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 30;
  let y = M;

  // Paleta alineada al dashboard
  const TEAL: [number, number, number] = [0, 184, 169];
  const TEAL_DARK: [number, number, number] = [0, 127, 115];
  const RED: [number, number, number] = [239, 68, 68];
  const GREEN: [number, number, number] = [34, 197, 94];
  const TEXT: [number, number, number] = [30, 41, 48];
  const MUTED: [number, number, number] = [120, 133, 139];

  const pageBreakIfNeeded = (advance = 0) => {
    if (y + advance > H - M) {
      pdf.addPage();
      y = M;
    }
  };

  const addTitle = (title: string) => {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...TEAL);
    pdf.setFontSize(19);
    pdf.text(title, M, y);
    y += 20;
    pdf.setTextColor(...TEXT);
  };

  // Header
  addTitle("Reporte - Dashboard Ejecutivo");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...MUTED);
  pdf.text(`Fecha: ${d.meta?.fecha || new Date().toLocaleDateString("es-AR")}`, M, y);
  y += 12;

  // (Sin tarjetas KPI para mantener estética similar a pro-salud)

  // Balance (line chart simple)
  if (d.balance?.length) {
    addTitle("Balance financiero");
    const area = { x: M, y: y, w: W - M * 2, h: 150 };
    const max = Math.max(1, ...d.balance.map(b => Math.max(b.ingresos, b.egresos, b.neto)));
    const min = Math.min(0, ...d.balance.map(b => Math.min(b.ingresos, b.egresos, b.neto)));
    const scaleX = area.w / Math.max(1, d.balance.length - 1);
    const scaleY = area.h / (max - min || 1);
    const mapPoint = (v: number, i: number): Point => ({ x: area.x + i * scaleX, y: area.y + area.h - (v - min) * scaleY });

    pdf.setDrawColor(200);
    pdf.rect(area.x, area.y, area.w, area.h);
    // grid horizontal
    pdf.setDrawColor(230);
    for (let i = 0; i <= 4; i++) {
      const gy = area.y + (i * area.h) / 4;
      pdf.line(area.x, gy, area.x + area.w, gy);
    }

    const drawLine = (key: "ingresos" | "egresos" | "neto", color: [number, number, number]) => {
      pdf.setDrawColor(...color);
      pdf.setLineWidth(1);
      d.balance.forEach((b, i) => {
        const p = mapPoint(b[key], i);
        if (i === 0) pdf.moveTo(p.x, p.y); else pdf.lineTo(p.x, p.y);
      });
      pdf.stroke();
    };
    drawLine("ingresos", TEAL);
    drawLine("egresos", RED);
    drawLine("neto", GREEN);

    // leyenda + totales
    const legendY = area.y + area.h + 14;
    const legend = [
      { t: "Ingresos", c: TEAL, v: d.balance.reduce((a,b)=>a+(b.ingresos||0),0) },
      { t: "Egresos", c: RED, v: d.balance.reduce((a,b)=>a+(b.egresos||0),0) },
      { t: "Neto", c: GREEN, v: d.balance.reduce((a,b)=>a+(b.neto||0),0) },
    ];
    pdf.setFontSize(10);
    legend.forEach((l, i) => {
      const lx = M + i * 140;
      pdf.setFillColor(...l.c); pdf.rect(lx, legendY - 8, 10, 10, "F");
      pdf.setTextColor(...TEXT); pdf.text(`${l.t}: $ ${Math.round(l.v).toLocaleString('es-AR')}`, lx + 16, legendY);
    });

    y += area.h + 30;
    pageBreakIfNeeded(210);
  }

  // Distribución de gastos (pie)
  if (d.gastos?.length) {
    addTitle("Distribución de gastos");
    const cx = M + 70, cy = y + 60, r = 50;
    const total = d.gastos.reduce((a, b) => a + (b.valor || 0), 0) || 1;
    let a0 = 0;
    const top = d.gastos.slice(0, 6);
    top.forEach((g, i) => {
      const frac = (g.valor || 0) / total; const a1 = a0 + frac * Math.PI * 2;
      const col: [number, number, number] = [0, 127 + (i * 18) % 120, 115 + (i * 10) % 100];
      pdf.setFillColor(...col);
      pdf.moveTo(cx, cy);
      for (let a = a0; a <= a1; a += Math.PI / 50) pdf.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      pdf.lineTo(cx, cy); pdf.fill();
      pdf.rect(cx + 90, y + 10 + i * 16 - 8, 8, 8, "F");
      pdf.setTextColor(...TEXT); pdf.setFontSize(10);
      pdf.text(`${g.nombre} ${(frac * 100).toFixed(1)}%  ($ ${Math.round(g.valor||0).toLocaleString('es-AR')})`, cx + 105, y + 10 + i * 16);
      a0 = a1;
    });
    y += 140; // más aire después de torta
    pageBreakIfNeeded(200);
    y += 12;
  }

  // Barras rendimiento de rutas
  if (d.rutas?.length) {
    addTitle("Rendimiento de rutas (km promedio)");
    const data = d.rutas.slice(0, 8);
    const max = Math.max(1, ...data.map(r => r.kmPromedio));
    const barW = (W - M * 2 - 80) / data.length;
    data.forEach((r, i) => {
      const h = Math.max(2, (r.kmPromedio / max) * 120);
      const x = M + 40 + i * barW; const by = y + 130 - h;
      pdf.setFillColor(...TEAL); pdf.rect(x, by, barW * 0.7, h, "F");
      pdf.setTextColor(...MUTED); pdf.setFontSize(8); pdf.text(String(r.ruta).slice(0, 12), x, y + 142, { angle: 0 });
      // valor encima
      pdf.setTextColor(...TEXT); pdf.setFontSize(9); pdf.text(String(Math.round(r.kmPromedio)), x + barW * 0.35, by - 4, { align: 'center' as any });
    });
    y += 170;
    pageBreakIfNeeded(240);
    y += 12;
  }

  // Ranking choferes (horizontal)
  if (d.ranking?.length) {
    addTitle(`Ranking de choferes por ${d.rankingMetric}`);
    const items = d.ranking.slice(0, 8);
    const max = Math.max(1, ...items.map(i => i[d.rankingMetric] as number));
    items.forEach((i, idx) => {
      const bar = ((i[d.rankingMetric] as number) / max) * (W - M * 2 - 160);
      const yRow = y + idx * 18;
      pdf.setTextColor(...TEXT); pdf.setFontSize(10); pdf.text(i.nombre.slice(0, 22), M, yRow);
      pdf.setFillColor(...TEAL); pdf.rect(M + 130, yRow - 8, bar, 10, "F");
      pdf.setTextColor(...TEXT); pdf.text(String(i[d.rankingMetric] ?? 0), M + 135 + bar, yRow);
    });
    y += 16 + items.length * 18;
    pageBreakIfNeeded(220);
    y += 12;
  }

  // Distribución ingresos por cliente (pie)
  if (d.ingresosCliente?.length) {
    addTitle("Distribución de ingresos por cliente");
    const cx = M + 70, cy = y + 58, r = 48;
    const total = d.ingresosCliente.reduce((a, b) => a + (b.valor || 0), 0) || 1;
    let a0 = 0;
    const top = d.ingresosCliente.slice(0, 7);
    top.forEach((g, i) => {
      const frac = (g.valor || 0) / total; const a1 = a0 + frac * Math.PI * 2;
      const col: [number, number, number] = [0, 160 - (i * 18) % 120, 150 + (i * 8) % 100];
      pdf.setFillColor(...col);
      pdf.moveTo(cx, cy);
      for (let a = a0; a <= a1; a += Math.PI / 50) pdf.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      pdf.lineTo(cx, cy); pdf.fill();
      pdf.rect(cx + 90, y + 10 + i * 16 - 8, 8, 8, "F");
      pdf.setTextColor(...TEXT); pdf.setFontSize(10);
      pdf.text(`${g.nombre.slice(0,22)} ${(frac * 100).toFixed(1)}%  ($ ${Math.round(g.valor||0).toLocaleString('es-AR')})`, cx + 105, y + 10 + i * 16);
      a0 = a1;
    });
    y += 135;

    // Tabla resumen top ingresos
    const startY = y;
    pdf.setFont("helvetica", "bold"); pdf.setTextColor(...TEXT); pdf.text("Top clientes (monto)", M, y); y += 12;
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.setTextColor(...MUTED);
    top.forEach((c, idx) => {
      pdf.text(`${idx + 1}. ${c.nombre.slice(0,40)}`, M, y);
      pdf.text(`$ ${Math.round(c.valor||0).toLocaleString('es-AR')}`, W - M - 120, y, { align: 'right' as any });
      y += 12; pageBreakIfNeeded(30);
    });
  }

  // Heatmap utilización
  if (d.heatmap && d.heatmap.max > 0) {
    pageBreakIfNeeded(220);
    addTitle("Mapa de calor de vehículos");
    const cell = 10; const padL = 36; const padT = 14;
    const rows = d.heatmap.matrix.length; const cols = d.heatmap.matrix[0].length;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = d.heatmap.matrix[r][c];
        const alpha = 0.1 + (v / d.heatmap.max) * 0.9;
        pdf.setFillColor(0, Math.round(184 * alpha), Math.round(169 * alpha));
        pdf.rect(M + padL + c * (cell + 1), y + padT + r * (cell + 1), cell, cell, "F");
      }
    }
    y += padT + rows * (cell + 1) + 20;
  }

  pdf.save(`dashboard-ejecutivo-${new Date().toLocaleDateString("es-AR")}.pdf`);
}
