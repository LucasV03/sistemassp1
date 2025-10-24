"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { Truck, TrendingUp, Wallet, DollarSign, AlertTriangle, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { generarReporteTransportePDF } from "./_utils/pdfReport";

/* 🎨 Paletas */
const COLORS = ["#00B8A9", "#007F73", "#00D1C1", "#004F47"];
const GASTOS_COLORS = ["#14b8a6", "#f59e0b", "#3b82f6", "#ef4444"];

/* ===========================================
   🔹 DASHBOARD PAGE DINÁMICO
   =========================================== */
export default function DashboardPage() {
  const exportRef = useRef<HTMLDivElement>(null);
  const [exportando, setExportando] = useState(false);
  // 🔹 Selector de período (semana | mes | trimestre)
  const [periodo, setPeriodo] = useState<"semana" | "mes" | "trimestre">("mes");
  // 🔹 Selectores por gráfico
  const [periodoBalance, setPeriodoBalance] = useState<"semana" | "mes" | "trimestre">("mes");
  const [periodoGastos, setPeriodoGastos] = useState<"semana" | "mes" | "trimestre">("mes");
  const [periodoRutas, setPeriodoRutas] = useState<"semana" | "mes" | "trimestre">("mes");
  const [periodoIngresosCliente, setPeriodoIngresosCliente] = useState<"semana" | "mes" | "trimestre">("mes");
  const [periodoRankingChoferes, setPeriodoRankingChoferes] = useState<"semana" | "mes" | "trimestre">("mes");
  const [periodoHeatmap, setPeriodoHeatmap] = useState<"semana" | "mes" | "trimestre">("mes");

  // 🔹 Consultas reales desde Convex
  const vehiculos = useQuery(api.vehiculos.listar, {}) ?? [];
  const facturas = useQuery(api.facturas_ventas.listarConCliente, {}) ?? [];
  const comprobantes = useQuery(api.comprobantes_prov.listar, {}) ?? [];
  const viajes = useQuery(api.viajes.listarConNombres, {}) ?? [];
  const choferes = useQuery(api.choferes.listar, {}) ?? [];
  const clientes = useQuery(api.clientes_ventas.listar, {}) ?? [];
  const proveedores = useQuery(api.proveedores.listar, {}) ?? [];

  // 🔹 Estilos de tooltip unificados (fondo claro dentro del tema + texto blanco)
  const tooltipStyles = {
    contentStyle: { backgroundColor: "#1b3a3f", border: "1px solid #2a6b70", color: "#ffffff" },
    labelStyle: { color: "#ffffff" },
    itemStyle: { color: "#ffffff" },
  } as const;

  // — Helpers de exportación (sin html2canvas): rasteriza SVG a PNG y dibuja heatmap en canvas
  const svgToPngDataUrl = async (svgRoot: SVGSVGElement, outWidth = 900): Promise<string> => {
    // Asegurar xmlns y dimensiones usando viewBox si width/height faltan
    const clone = svgRoot.cloneNode(true) as SVGSVGElement;
    if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const vb = clone.getAttribute('viewBox');
    const vbParts = vb ? vb.split(/\s+/).map(Number) : [0,0,Number(clone.getAttribute('width')||0), Number(clone.getAttribute('height')||0)];
    const vbW = vbParts[2] || 1200;
    const vbH = vbParts[3] || 600;
    let svgW = Number(clone.getAttribute('width')) || vbW;
    let svgH = Number(clone.getAttribute('height')) || vbH;
    const ratio = svgW ? outWidth / svgW : 1;
    const xml = new XMLSerializer().serializeToString(clone);
    const svg64 = typeof window.btoa === 'function' ? window.btoa(unescape(encodeURIComponent(xml))) : '';
    const imgSrc = `data:image/svg+xml;base64,${svg64}`;
    const img = new Image();
    img.src = imgSrc;
    await new Promise((res) => (img.onload = () => res(null)));
    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = Math.max(1, Math.round((svgH || img.height || 1) * ratio));
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#111f24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  };

  const heatmapToPngDataUrl = (): string => {
    const cell = 20; // px
    const padL = 40; // espacio para etiquetas
    const padT = 20;
    const cols = 24, rows = 7;
    const w = padL + cols * cell;
    const h = padT + rows * cell;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#111f24'; ctx.fillRect(0,0,w,h);
    // etiquetas horas
    ctx.fillStyle = '#a3a3a3'; ctx.font = '10px Arial'; ctx.textAlign = 'center';
    for (let c=0;c<cols;c++) ctx.fillText(String(c), padL + c*cell + cell/2, 12);
    // etiquetas días
    const days = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    ctx.textAlign = 'right';
    days.forEach((d,r)=> ctx.fillText(d, padL-6, padT + r*cell + cell*0.65));
    // celdas
    for (let r=0;r<rows;r++){
      for (let c=0;c<cols;c++){
        const v = heatmapUtilizacion.matrix[r][c];
        const pct = v / (heatmapUtilizacion.max || 1);
        const alpha = 0.1 + pct*0.9;
        ctx.fillStyle = `rgba(0,184,169,${alpha})`;
        ctx.fillRect(padL + c*cell, padT + r*cell, cell-1, cell-1);
      }
    }
    return canvas.toDataURL('image/png');
  };

  const exportarPdf = async () => {
    setExportando(true);
    try {
      // Helper local para crear rango e inRange por período
      const rBalance = rango(periodoBalance);
      const rGastos = rango(periodoGastos);
      const rRutas = rango(periodoRutas);
      const rRanking = rango(periodoRankingChoferes);
      const rIngresos = rango(periodoIngresosCliente);
      const rHeatmap = rango(periodoHeatmap);

      const inRange = (d: any, from: Date, to: Date) => {
        const x = new Date(d);
        return x >= from && x < to;
      };

      // Balance diario (según periodoBalance)
      const balance: { fecha: string; ingresos: number; egresos: number; neto: number }[] = [];
      {
        const cursor = new Date(rBalance.from);
        while (cursor < rBalance.to) {
          const key = cursor.toLocaleDateString('es-AR');
          const ingresos = facturas
            .filter((f: any) => f?.creadoEn && inRange(f.creadoEn, rBalance.from, rBalance.to) && new Date(f.creadoEn).toLocaleDateString('es-AR') === key)
            .reduce((a: number, b: any) => a + (b.total || 0), 0);
          const egresos = comprobantes
            .filter((c: any) => c?.creadoEn && inRange(c.creadoEn, rBalance.from, rBalance.to) && c.estado === 'PAGADO' && new Date(c.creadoEn).toLocaleDateString('es-AR') === key)
            .reduce((a: number, b: any) => a + (b.total || 0), 0);
          balance.push({ fecha: key, ingresos, egresos, neto: ingresos - egresos });
          cursor.setDate(cursor.getDate() + 1);
        }
      }

      // Gastos por tipo (según periodoGastos)
      const gastosMap: Record<string, number> = {};
      comprobantes
        .filter((c: any) => c?.creadoEn && inRange(c.creadoEn, rGastos.from, rGastos.to) && c.estado === 'PAGADO')
        .forEach((c: any) => {
          const tipo = c.tipoComprobanteNombre || 'Otros';
          gastosMap[tipo] = (gastosMap[tipo] || 0) + (c.total || 0);
        });
      const gastos = Object.entries(gastosMap)
        .map(([nombre, valor]) => ({ nombre, valor }))
        .sort((a, b) => b.valor - a.valor);

      // Rutas (según periodoRutas)
      const rutasAgg: Record<string, number[]> = {};
      viajes
        .filter((v: any) => v?.creadoEn && inRange(v.creadoEn, rRutas.from, rRutas.to))
        .forEach((v: any) => {
          const ruta = `${v.origen} - ${v.destino}`;
          if (!rutasAgg[ruta]) rutasAgg[ruta] = [];
          rutasAgg[ruta].push(v.distanciaKm || 0);
        });
      const rutas = Object.entries(rutasAgg)
        .map(([ruta, arr]) => ({ ruta, kmPromedio: arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0 }))
        .sort((a, b) => b.kmPromedio - a.kmPromedio);

      // Ranking (según periodoRankingChoferes)
      const rMap: Record<string, { nombre: string; viajes: number; km: number }> = {};
      viajes
        .filter((v: any) => v?.creadoEn && inRange(v.creadoEn, rRanking.from, rRanking.to))
        .forEach((v: any) => {
          const id = String(v.choferId ?? v.chofer_id ?? v.chofer?.id ?? 's/n');
          const nombre = v.choferNombre || v.chofer_nombre || v.chofer?.nombreCompleto || v.chofer?.nombre || `Chofer ${id.slice(-4)}`;
          if (!rMap[id]) rMap[id] = { nombre, viajes: 0, km: 0 };
          rMap[id].viajes += 1;
          rMap[id].km += Number(v.distanciaKm || 0);
        });
      const ranking = Object.values(rMap).sort((a, b) => (metricChofer === 'viajes' ? b.viajes - a.viajes : b.km - a.km));

      // Ingresos por cliente (según periodoIngresosCliente)
      const icMap: Record<string, number> = {};
      facturas
        .filter((f: any) => f?.creadoEn && inRange(f.creadoEn, rIngresos.from, rIngresos.to))
        .forEach((f: any) => {
          const nombre = f.clienteNombre || f.cliente?.nombreCompleto || f.cliente?.razonSocial || f.cliente?.nombre || 'No identificado';
          icMap[nombre] = (icMap[nombre] || 0) + (f.total || 0);
        });
      const ingresosCliente = Object.entries(icMap)
        .map(([nombre, valor]) => ({ nombre, valor }))
        .sort((a, b) => b.valor - a.valor);

      // Heatmap (según periodoHeatmap y vehículo)
      let heatmap: { matrix: number[][]; max: number } | undefined = undefined;
      if (vehiculoHeatmap) {
        const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
        viajes
          .filter((v: any) => v?.creadoEn && inRange(v.creadoEn, rHeatmap.from, rHeatmap.to))
          .forEach((v: any) => {
            const id = String(v.vehiculoId ?? v.vehiculo_id ?? v.vehiculo?.id ?? '');
            if (String(vehiculoHeatmap) !== id) return;
            const d = new Date(v.creadoEn);
            let dow = d.getDay();
            dow = dow === 0 ? 6 : dow - 1;
            const h = d.getHours();
            if (dow >= 0 && dow < 7 && h >= 0 && h < 24) matrix[dow][h]++;
          });
        const max = matrix.flat().reduce((a, b) => Math.max(a, b), 0) || 1;
        heatmap = { matrix, max };
      }

      await generarReporteTransportePDF({
        balance,
        gastos,
        rutas,
        ranking,
        rankingMetric: metricChofer,
        ingresosCliente,
        heatmap,
        meta: { fecha: new Date().toLocaleDateString('es-AR') },
      });
    } finally {
      setExportando(false);
    }
  };

  /* ========================================================
     📊 CÁLCULOS DINÁMICOS
     ======================================================== */

  // — Helper de rango por período
  const rango = (p: "semana" | "mes" | "trimestre") => {
    const hoy = new Date();
    if (p === "semana") {
      const day = hoy.getDay() || 7; // 1..7, Lunes=1
      const desde = new Date(hoy);
      desde.setDate(hoy.getDate() - (day - 1));
      const hasta = new Date(desde);
      hasta.setDate(desde.getDate() + 7);
      return { from: desde, to: hasta };
    }
    if (p === "mes") {
      const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
      return { from: desde, to: hasta };
    }
    // últimos 3 meses (incluye mes actual)
    const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    return { from: desde, to: hasta };
  };

  // — Rango de fechas según período global (alineado a pro-salud)
  const { from: rangoFrom, to: rangoTo } = useMemo(() => rango(periodo), [periodo]);

  // — Helpers de filtrado por rango
  const enRango = (d: any) => {
    const fecha = new Date(d);
    return fecha >= rangoFrom && fecha < rangoTo;
  };

  // — Colecciones filtradas por período
  const facturasRango = useMemo(
    () => facturas.filter((f: any) => f?.creadoEn && enRango(f.creadoEn)),
    [facturas, rangoFrom, rangoTo]
  );
  const comprobantesRango = useMemo(
    () => comprobantes.filter((c: any) => c?.creadoEn && enRango(c.creadoEn)),
    [comprobantes, rangoFrom, rangoTo]
  );
  const viajesRango = useMemo(
    () => viajes.filter((v: any) => v?.creadoEn && enRango(v.creadoEn)),
    [viajes, rangoFrom, rangoTo]
  );

  // — Totales
  const totalFacturado = facturasRango.reduce((a: number, f: any) => a + (f.total || 0), 0);
  const totalEgresos = comprobantesRango
    .filter((c: any) => c.estado === "PAGADO")
    .reduce((a: number, c: any) => a + (c.total || 0), 0);
  const totalPendiente = facturasRango
    .filter((f: any) => f.estado === "PENDIENTE")
    .reduce((a: number, f: any) => a + (f.total || 0), 0);
  const totalGanancia = totalFacturado - totalEgresos;

  const totalVehiculos = vehiculos.length;
  const totalViajes = viajes.length;
  const totalChoferes = choferes.length;
  const totalClientes = clientes.length;
  const totalProveedores = proveedores.length;

  // — Estado de flota
  const estadoFlota = useMemo(() => {
    const counts: Record<string, number> = {};
    vehiculos.forEach((v: any) => {
      counts[v.estado] = (counts[v.estado] || 0) + 1;
    });
    return Object.entries(counts).map(([estado, cantidad]) => ({ estado, cantidad }));
  }, [vehiculos]);

  // — Tasa de utilización
  const flotaOperativa = vehiculos.filter((v: any) => v.estado === "OPERATIVO").length || 0;
  const tasaUtilizacion = totalVehiculos ? Math.round((flotaOperativa / totalVehiculos) * 100) : 0;

  // — Serie temporal (por día) de ingresos / egresos / neto según período (propio del gráfico)
  const balanceTemporal = useMemo(() => {
    const { from, to } = rango(periodoBalance);
    // inicializar todos los días del rango
    const cursor = new Date(from);
    const out: { fecha: string; ingresos: number; egresos: number; neto: number }[] = [];
    const keyOf = (d: Date) => d.toLocaleDateString("es-AR");
    const map: Record<string, number> = {};

    while (cursor < to) {
      const k = keyOf(cursor);
      map[k] = out.length;
      out.push({ fecha: k, ingresos: 0, egresos: 0, neto: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    const add = (fecha: number | string, tipo: "ingresos" | "egresos", total: number) => {
      const d = new Date(fecha);
      const k = keyOf(d);
      const idx = map[k];
      if (idx !== undefined) {
        out[idx][tipo] += total;
      }
    };
    facturas
      .filter((f: any) => f?.creadoEn && new Date(f.creadoEn) >= from && new Date(f.creadoEn) < to)
      .forEach((f: any) => add(f.creadoEn, "ingresos", f.total || 0));
    comprobantes
      .filter((c: any) => c?.creadoEn && new Date(c.creadoEn) >= from && new Date(c.creadoEn) < to)
      .filter((c: any) => c.estado === "PAGADO")
      .forEach((c: any) => add(c.creadoEn, "egresos", c.total || 0));

    out.forEach((d) => (d.neto = d.ingresos - d.egresos));
    return out;
  }, [facturas, comprobantes, periodoBalance]);

  // — Líneas visibles en el gráfico (ingresos, egresos, neto)
  const [lineasVisibles, setLineasVisibles] = useState<{
    ingresos: boolean;
    egresos: boolean;
    neto: boolean;
  }>({ ingresos: true, egresos: true, neto: true });

  // — Dominio + ticks del eje Y con paso fijo de 500.000
  const { yDomainFixed, yTicksFixed } = useMemo(() => {
    const step = 500_000;
    const valores: number[] = [];
    for (const d of balanceTemporal) {
      if (lineasVisibles.ingresos) valores.push(d.ingresos);
      if (lineasVisibles.egresos) valores.push(d.egresos);
      if (lineasVisibles.neto) valores.push(d.neto);
    }
    let min = 0;
    let max = 0;
    if (valores.length) {
      min = Math.min(...valores);
      max = Math.max(...valores);
    }
    if (min === max) {
      // expandir simétricamente alrededor del valor para que se vea la línea
      min = min - step;
      max = max + step;
    }
    let niceMin = Math.floor(min / step) * step;
    let niceMax = Math.ceil(max / step) * step;
    if (niceMin === niceMax) niceMax = niceMin + step;
    const ticks: number[] = [];
    for (let t = niceMin; t <= niceMax; t += step) ticks.push(t);
    return { yDomainFixed: [niceMin, niceMax] as [number, number], yTicksFixed: ticks };
  }, [balanceTemporal, lineasVisibles]);

  // — Distribución de gastos (dinámica desde tipo de comprobante)
  const gastosDistribucion = useMemo(() => {
    const { from, to } = rango(periodoGastos);
    const agrupado: Record<string, number> = {};
    comprobantes
      .filter((c: any) => c?.creadoEn && new Date(c.creadoEn) >= from && new Date(c.creadoEn) < to)
      .filter((c: any) => c.estado === "PAGADO")
      .forEach((c: any) => {
        const tipo = c.tipoComprobanteNombre || "Otros";
        agrupado[tipo] = (agrupado[tipo] || 0) + (c.total || 0);
      });
    return Object.entries(agrupado).map(([nombre, valor]) => ({ nombre, valor }));
  }, [comprobantes, periodoGastos]);

  // — Distribución de ingresos por cliente (periodo seleccionado)
  const ingresosPorCliente = useMemo(() => {
    const { from, to } = rango(periodoIngresosCliente);
    const pickNombre = (f: any) => {
      const candidatos = [
        f.clienteNombre,
        f.cliente_nombre,
        f.clienteRazonSocial,
        f.clienteDenominacion,
        f.clienteFantasia,
        f.cliente?.nombreCompleto,
        f.cliente?.razonSocial,
        f.cliente?.denominacion,
        f.cliente?.fantasia,
        f.cliente?.nombre,
      ].filter((v: any) => typeof v === "string" && v.trim().length > 0);
      if (candidatos.length) return candidatos[0];
      if (f.clienteId) return `Cliente ${String(f.clienteId).slice(-4)}`;
      return "No identificado";
    };
    const map: Record<string, number> = {};
    facturas
      .filter((f: any) => f?.creadoEn && new Date(f.creadoEn) >= from && new Date(f.creadoEn) < to)
      .forEach((f: any) => {
      const nombre = pickNombre(f);
      const total = Number(f.total || 0);
      map[nombre] = (map[nombre] || 0) + total;
    });
    const pares = Object.entries(map)
      .map(([nombre, valor]) => ({ nombre, valor }))
      .sort((a, b) => b.valor - a.valor);

    // Top N + Otros
    const TOP = 7;
    const top = pares.slice(0, TOP);
    const resto = pares.slice(TOP);
    const otrosTotal = resto.reduce((a, r) => a + r.valor, 0);
    return otrosTotal > 0 ? [...top, { nombre: "Otros", valor: otrosTotal }] : top;
  }, [facturas, periodoIngresosCliente]);

  const ingresosPorClienteTotal = useMemo(
    () => ingresosPorCliente.reduce((a, i) => a + (i.valor || 0), 0),
    [ingresosPorCliente]
  );

  // — Rendimiento de rutas (dinámico desde viajes)
  const rendimientoRutas = useMemo(() => {
    const { from, to } = rango(periodoRutas);
    const agrupado: Record<string, number[]> = {};
    viajes
      .filter((v: any) => v?.creadoEn && new Date(v.creadoEn) >= from && new Date(v.creadoEn) < to)
      .forEach((v: any) => {
      const ruta = `${v.origen} - ${v.destino}`;
      if (!agrupado[ruta]) agrupado[ruta] = [];
      // tu modelo expone 'distanciaKm' (no 'km')
      agrupado[ruta].push(v.distanciaKm || 0);
    });
    return Object.entries(agrupado).map(([ruta, kms]) => ({
      ruta,
      kmPromedio: kms.length ? Math.round(kms.reduce((a, b) => a + b, 0) / kms.length) : 0,
    }));
  }, [viajes, periodoRutas]);

  // — Ranking de choferes (por viajes y km)
  const [metricChofer, setMetricChofer] = useState<"viajes" | "km">("viajes");
  const rankingChoferes = useMemo(() => {
    const { from, to } = rango(periodoRankingChoferes);
    const map: Record<string, { nombre: string; viajes: number; km: number }> = {};
    viajes
      .filter((v: any) => v?.creadoEn && new Date(v.creadoEn) >= from && new Date(v.creadoEn) < to)
      .forEach((v: any) => {
      const id = String(v.choferId ?? v.chofer_id ?? v.chofer?.id ?? "s/n");
      const nombre =
        v.choferNombre || v.chofer_nombre || v.chofer?.nombreCompleto || v.chofer?.nombre || `Chofer ${id.slice(-4)}`;
      if (!map[id]) map[id] = { nombre, viajes: 0, km: 0 };
      map[id].viajes += 1;
      map[id].km += Number(v.distanciaKm || 0);
    });
    return Object.values(map)
      .sort((a, b) => (metricChofer === "viajes" ? b.viajes - a.viajes : b.km - a.km))
      .slice(0, 10);
  }, [viajes, metricChofer, periodoRankingChoferes]);

  // — Selección de vehículo para heatmap
  const [vehiculoHeatmap, setVehiculoHeatmap] = useState<string>("");

  // — Heatmap de utilización (día x hora, usando fecha creación del viaje)
  const heatmapUtilizacion = useMemo(() => {
    const { from, to } = rango(periodoHeatmap);
    const vehIdSel = vehiculoHeatmap ? String(vehiculoHeatmap) : "";
    const viajesFiltrados = vehIdSel
      ? viajes
          .filter((v: any) => v?.creadoEn && new Date(v.creadoEn) >= from && new Date(v.creadoEn) < to)
          .filter((v: any) => {
          const id = String(v.vehiculoId ?? v.vehiculo_id ?? v.vehiculo?.id ?? "");
          return id === vehIdSel;
        })
      : [];
    const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    viajesFiltrados.forEach((v: any) => {
      const d = new Date(v.creadoEn);
      // 0=domingo...6=sábado -> convertimos a 0=Lunes..6=Domingo
      let dow = d.getDay();
      dow = dow === 0 ? 6 : dow - 1;
      const hour = d.getHours();
      if (dow >= 0 && dow < 7 && hour >= 0 && hour < 24) matrix[dow][hour]++;
    });
    const max = matrix.flat().reduce((a, b) => Math.max(a, b), 0) || 1;
    return { matrix, max };
  }, [viajes, vehiculoHeatmap, periodoHeatmap]);

  // — Resumen del heatmap (sumas por día y por hora)
  const heatmapResumen = useMemo(() => {
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
    const daySums = heatmapUtilizacion.matrix.map((row) => row.reduce((a, b) => a + b, 0));
    const hourSums = Array.from({ length: 24 }, (_, h) =>
      heatmapUtilizacion.matrix.reduce((a, row) => a + row[h], 0)
    );
    const total = daySums.reduce((a, b) => a + b, 0);
    const topDias = daySums
      .map((v, i) => ({ dia: days[i], valor: v }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
    const topHoras = hourSums
      .map((v, i) => ({ hora: i, valor: v }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
    return { daySums, hourSums, total, topDias, topHoras };
  }, [heatmapUtilizacion]);

  // — Hover/click info en el heatmap
  const [hmInfo, setHmInfo] = useState<{ dia: string; hora: number; valor: number } | null>(null);

  // — Últimos viajes
  const ultimosViajes = useMemo(
    () =>
      [...viajesRango]
        .sort((a: any, b: any) => (b.creadoEn || 0) - (a.creadoEn || 0))
        .slice(0, 5),
    [viajesRango]
  );

  // — Alertas dinámicas (sin tabla extra)
  const hoyIso = new Date().toISOString();
  const alertasActivas = useMemo(() => {
    const out: { descripcion: string; prioridad: "ALTA" | "MEDIA" | "BAJA"; fecha: string }[] = [];

    // Vehículos fuera de servicio o en mantenimiento
    vehiculos
      .filter((v: any) => v.estado && v.estado !== "OPERATIVO")
      .forEach((v: any) =>
        out.push({
          descripcion: `Vehículo "${v.nombre}" en estado: ${v.estado}`,
          prioridad: v.estado === "MANTENIMIENTO" ? "MEDIA" : "ALTA",
          fecha: new Date(v.actualizadoEn || v.creadoEn || Date.now()).toLocaleDateString("es-AR"),
        })
      );

    // Comprobantes proveedor vencidos (si 'fecha' < hoy y no pagado)
    comprobantes
      .filter((c: any) => c.estado !== "PAGADO" && c.fecha && c.fecha < hoyIso)
      .forEach((c: any) =>
        out.push({
          descripcion: `Comprobante prov. ${c.letra}-${c.sucursal}-${c.numero} vencido`,
          prioridad: "ALTA",
          fecha: new Date(c.fecha).toLocaleDateString("es-AR"),
        })
      );

    return out.slice(0, 5);
  }, [vehiculos, comprobantes]);

  /* ========================================================
     🧭 RENDERIZADO
     ======================================================== */
  return (
    <main className="min-h-screen bg-[#0d1b1e] text-[#e6f6f7] p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-baseline md:justify-between">
        <h1 className="text-3xl font-bold text-[#00B8A9] tracking-tight">Dashboard Ejecutivo</h1>
        <div className="flex items-baseline gap-4">
          <button
            onClick={exportarPdf}
            disabled={exportando}
            className="rounded-full bg-[#00B8A9] text-[#0d1b1e] hover:bg-[#00d1c1] disabled:opacity-60 px-4 h-8 text-sm"
          >
            {exportando ? "Exportando…" : "Exportar PDF"}
          </button>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-gray-400">Período</span>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as any)}
              className="bg-[#0f1c20] border border-[#184347] rounded-full px-3 h-8 text-sm text-[#e6f6f7] shadow-inner hover:border-[#20666c] focus:outline-none focus:ring-2 focus:ring-[#00B8A9]"
            >
              <option value="semana">Semana actual</option>
              <option value="mes">Mes actual</option>
              <option value="trimestre">Últimos 3 meses</option>
            </select>
          </div>
          <span className="hidden md:block h-4 w-px bg-[#143337]" />
          <p className="text-xs md:text-sm text-gray-400 whitespace-nowrap leading-none">
            Última actualización: {new Date().toLocaleDateString("es-AR")}
          </p>
        </div>
      </div>

      {/* Contenido exportable */}
      <div ref={exportRef} data-export className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-6">
        <KpiCard title="Vehículos" value={totalVehiculos} icon={<Truck />} />
        <KpiCard title="Viajes" value={totalViajes} icon={<TrendingUp />} />
        <KpiCard title="Facturación total" value={`$${totalFacturado.toLocaleString("es-AR")}`} icon={<DollarSign />} />
        <KpiCard title="Egresos pagados" value={`$${totalEgresos.toLocaleString("es-AR")}`} icon={<Wallet />} color="red" />
        <KpiCard
          title="Ganancia neta"
          value={`$${totalGanancia.toLocaleString("es-AR")}`}
          icon={<BarChart3 />}
          color={totalGanancia >= 0 ? "green" : "red"}
        />
        <KpiCard title="Tasa de utilización" value={`${tasaUtilizacion}%`} icon={<Truck />} />
      </div>

      {/* Balance temporal (según período) */}
      <Card className="bg-[#111f24] border border-[#0f2c2e] rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-[#00B8A9]">Balance financiero</CardTitle>
            <select
              value={periodoBalance}
              onChange={(e) => setPeriodoBalance(e.target.value as any)}
              className="bg-[#0f1c20] border border-[#184347] rounded-full px-3 h-8 text-sm text-[#e6f6f7]"
            >
              <option value="semana">Semana actual</option>
              <option value="mes">Mes actual</option>
              <option value="trimestre">Últimos 3 meses</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          {/* Filtros de series */}
          <div className="flex gap-2 mb-3">
            {([
              { key: "ingresos", label: "Facturación total", color: "#00B8A9" },
              { key: "egresos", label: "Egresos", color: "#ef4444" },
              { key: "neto", label: "Ganancia neta", color: "#22c55e" },
            ] as const).map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() =>
                  setLineasVisibles((p) => ({ ...p, [key]: !p[key] }))
                }
                className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                  lineasVisibles[key]
                    ? "bg-[#0f2c2e]"
                    : "bg-transparent opacity-60"
                }`}
                style={{ borderColor: color, color }}
              >
                {label}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={balanceTemporal} id="chart-balance">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2b2e" />
              <XAxis dataKey="fecha" stroke="#a3a3a3" />
              <YAxis
                stroke="#a3a3a3"
                domain={yDomainFixed as any}
                ticks={yTicksFixed as any}
                allowDecimals={false}
                width={90}
                tickMargin={8}
                tickFormatter={(v: any) =>
                  `$${Number(v).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
                }
              />
              <Tooltip
                contentStyle={tooltipStyles.contentStyle}
                labelStyle={tooltipStyles.labelStyle}
                itemStyle={tooltipStyles.itemStyle}
                formatter={(value: any) =>
                  Number(value).toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    maximumFractionDigits: 0,
                  })
                }
              />
              {lineasVisibles.ingresos && (
                <Line type="monotone" dataKey="ingresos" stroke="#00B8A9" strokeWidth={2} dot={false} />
              )}
              {lineasVisibles.egresos && (
                <Line type="monotone" dataKey="egresos" stroke="#ef4444" strokeWidth={2} dot={false} />
              )}
              {lineasVisibles.neto && (
                <Line type="monotone" dataKey="neto" stroke="#22c55e" strokeWidth={2} dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gastos y rutas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de gastos */}
        <Card className="bg-[#111f24] border border-[#0f2c2e] rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-[#00B8A9]">Distribución de gastos</CardTitle>
            <select
              value={periodoGastos}
              onChange={(e) => setPeriodoGastos(e.target.value as any)}
              className="bg-[#0f1c20] border border-[#184347] rounded-full px-3 h-8 text-sm text-[#e6f6f7]"
            >
              <option value="semana">Semana actual</option>
              <option value="mes">Mes actual</option>
              <option value="trimestre">Últimos 3 meses</option>
            </select>
          </div>
        </CardHeader>
          <CardContent className="h-72 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart id="chart-gastos">
                <Pie
                  data={gastosDistribucion}
                  dataKey="valor"
                  nameKey="nombre"
                  outerRadius={100}
                  label={renderGastoLabel}
                >
                  {gastosDistribucion.map((_, i) => (
                    <Cell key={i} fill={GASTOS_COLORS[i % GASTOS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyles.contentStyle}
                  labelStyle={tooltipStyles.labelStyle}
                  itemStyle={tooltipStyles.itemStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rendimiento de rutas */}
        <Card className="bg-[#111f24] border border-[#0f2c2e] rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-[#00B8A9]">Rendimiento de rutas</CardTitle>
            <select
              value={periodoRutas}
              onChange={(e) => setPeriodoRutas(e.target.value as any)}
              className="bg-[#0f1c20] border border-[#184347] rounded-full px-3 h-8 text-sm text-[#e6f6f7]"
            >
              <option value="semana">Semana actual</option>
              <option value="mes">Mes actual</option>
              <option value="trimestre">Últimos 3 meses</option>
            </select>
          </div>
        </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rendimientoRutas} id="chart-rutas">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2b2e" />
                <XAxis dataKey="ruta" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip
                  contentStyle={tooltipStyles.contentStyle}
                  labelStyle={tooltipStyles.labelStyle}
                  itemStyle={tooltipStyles.itemStyle}
                />
                <Bar dataKey="kmPromedio" fill="#00B8A9" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de choferes */}
      <Card className="bg-[#111f24] border border-[#0f2c2e] rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-[#00B8A9]">Ranking de choferes</CardTitle>
            <select
              value={periodoRankingChoferes}
              onChange={(e) => setPeriodoRankingChoferes(e.target.value as any)}
              className="bg-[#0f1c20] border border-[#184347] rounded-full px-3 h-8 text-sm text-[#e6f6f7]"
            >
              <option value="semana">Semana actual</option>
              <option value="mes">Mes actual</option>
              <option value="trimestre">Últimos 3 meses</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="h-96">
          <div className="flex gap-2 mb-3">
            {(["viajes", "km"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetricChofer(m)}
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  metricChofer === m ? "bg-[#0f2c2e]" : "bg-transparent opacity-70"
                }`}
                style={{ borderColor: m === "viajes" ? "#00B8A9" : "#3b82f6", color: "#e6f6f7" }}
              >
                {m === "viajes" ? "Por viajes" : "Por km"}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rankingChoferes} layout="vertical" margin={{ left: 80 }} id="chart-ranking">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2b2e" />
              <XAxis type="number" stroke="#a3a3a3" tickFormatter={(v) => (metricChofer === "km" ? `${v} km` : `${v}`)} />
              <YAxis type="category" dataKey="nombre" stroke="#a3a3a3" width={120} />
              <Tooltip
                contentStyle={tooltipStyles.contentStyle}
                labelStyle={tooltipStyles.labelStyle}
                itemStyle={tooltipStyles.itemStyle}
                formatter={(value: any) =>
                  metricChofer === "km" ? `${Number(value).toLocaleString("es-AR")} km` : Number(value)
                }
              />
              <Bar dataKey={metricChofer} fill={metricChofer === "km" ? "#3b82f6" : "#00B8A9"} radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Heatmap de utilización */}
      <Card className="bg-[#111f24] border border-[#0f2c2e] rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-[#00B8A9]">Mapa de calor de vehículos</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={periodoHeatmap}
                onChange={(e) => setPeriodoHeatmap(e.target.value as any)}
                className="bg-[#0f1c20] border border-[#184347] rounded-full px-3 h-8 text-sm text-[#e6f6f7]"
              >
                <option value="semana">Semana actual</option>
                <option value="mes">Mes actual</option>
                <option value="trimestre">Últimos 3 meses</option>
              </select>
              <span className="text-sm text-gray-400">Vehículo</span>
              <select
                value={vehiculoHeatmap}
                onChange={(e) => setVehiculoHeatmap(e.target.value)}
                className="bg-[#0f1c20] border border-[#184347] rounded-full px-3 h-8 text-sm text-[#e6f6f7] shadow-inner hover:border-[#20666c] focus:outline-none focus:ring-2 focus:ring-[#00B8A9]"
              >
                <option value="">Seleccionar…</option>
                {vehiculos.map((v: any) => (
                  <option key={String(v._id || v.id)} value={String(v._id || v.id)}>
                    {v.nombre || v.patente || v.alias || `Vehículo ${String(v._id || v.id).slice(-4)}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="mb-2 text-sm text-gray-300 min-h-5">
                {hmInfo ? (
                  <span>
                    {hmInfo.dia} {hmInfo.hora}:00 — {hmInfo.valor} {hmInfo.valor === 1 ? "viaje" : "viajes"}
                  </span>
                ) : (
                  <span className="text-gray-500">Pasa el mouse o haz click en una celda</span>
                )}
              </div>
              <div className="grid grid-cols-[80px_repeat(24,1fr)] gap-1">
                <div></div>
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="text-center text-xs text-gray-400">{h}</div>
                ))}
                {(["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const).map((dLabel, dIdx) => (
                  <div key={`row-${dIdx}`} className="contents">
                    <div className="text-right pr-2 text-xs text-gray-400 flex items-center justify-end">
                      {dLabel}
                    </div>
                    {Array.from({ length: 24 }).map((_, h) => {
                      const c = heatmapUtilizacion.matrix[dIdx][h];
                      const pct = c / heatmapUtilizacion.max;
                      const bg = `rgba(0, 184, 169, ${0.1 + pct * 0.9})`;
                      return (
                        <button
                          key={`c-${dIdx}-${h}`}
                          onMouseEnter={() => setHmInfo({ dia: dLabel, hora: h, valor: c })}
                          onFocus={() => setHmInfo({ dia: dLabel, hora: h, valor: c })}
                          onClick={() => setHmInfo({ dia: dLabel, hora: h, valor: c })}
                          title={`${dLabel} ${h}:00 — ${c} viajes`}
                          className="h-6 rounded-sm focus:outline-none"
                          style={{ backgroundColor: bg }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                <span>Menor</span>
                <div className="h-3 w-16 rounded" style={{ background: "linear-gradient(to right, rgba(0,184,169,0.1), rgba(0,184,169,1))" }} />
                <span>Mayor</span>
              </div>
              {!vehiculoHeatmap && (
                <p className="mt-2 text-xs text-yellow-400">Selecciona un vehículo para ver su utilización.</p>
              )}
              {vehiculoHeatmap && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-300 mb-2">Top días</p>
                    <table className="w-full text-sm">
                      <tbody>
                        {heatmapResumen.topDias.map((d, i) => (
                          <tr key={i} className="border-t border-[#1a2b2e]">
                            <td className="py-1 text-gray-300">{d.dia}</td>
                            <td className="py-1 text-right text-[#e6f6f7]">{d.valor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-2">Top horas</p>
                    <table className="w-full text-sm">
                      <tbody>
                        {heatmapResumen.topHoras.map((h, i) => (
                          <tr key={i} className="border-t border-[#1a2b2e]">
                            <td className="py-1 text-gray-300">{h.hora}:00</td>
                            <td className="py-1 text-right text-[#e6f6f7]">{h.valor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-2">Totales</p>
                    <div className="text-sm text-[#e6f6f7]">Viajes en período: {heatmapResumen.total}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribución de ingresos por cliente */}
      <Card className="bg-[#111f24] border border-[#0f2c2e] rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-[#00B8A9]">Distribución de ingresos por cliente</CardTitle>
            <select
              value={periodoIngresosCliente}
              onChange={(e) => setPeriodoIngresosCliente(e.target.value as any)}
              className="bg-[#0f1c20] border border-[#184347] rounded-full px-3 h-8 text-sm text-[#e6f6f7]"
            >
              <option value="semana">Semana actual</option>
              <option value="mes">Mes actual</option>
              <option value="trimestre">Últimos 3 meses</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart id="chart-ingresos">
                  <Pie
                    data={ingresosPorCliente}
                    dataKey="valor"
                    nameKey="nombre"
                    outerRadius={110}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {ingresosPorCliente.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyles.contentStyle}
                    labelStyle={tooltipStyles.labelStyle}
                    itemStyle={tooltipStyles.itemStyle}
                    formatter={(value: any, name: any) => [
                      `$${Number(value).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-300">
                    <th className="text-left pb-2">Cliente</th>
                    <th className="text-right pb-2">Monto</th>
                    <th className="text-right pb-2">%</th>
                  </tr>
                </thead>
                <tbody>
                  {ingresosPorCliente.map((item, idx) => {
                    const pct = ingresosPorClienteTotal
                      ? (item.valor / ingresosPorClienteTotal) * 100
                      : 0;
                    return (
                      <tr key={idx} className="border-t border-[#1a2b2e] hover:bg-[#102528]">
                        <td className="py-2 pr-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block w-3 h-3 rounded-sm"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <span className="text-[#e6f6f7]">{item.nombre}</span>
                          </div>
                        </td>
                        <td className="py-2 text-right text-[#e6f6f7]">
                          {`$${Number(item.valor).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
                        </td>
                        <td className="py-2 text-right text-[#e6f6f7]">{pct.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t border-[#1a2b2e]">
                    <td className="py-2 text-[#a7c7c9]">Total</td>
                    <td className="py-2 text-right text-[#a7c7c9]">
                      {`$${Number(ingresosPorClienteTotal).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
                    </td>
                    <td className="py-2 text-right text-[#a7c7c9]">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      <Card className="bg-[#111f24] border border-[#0f2c2e] rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#00B8A9]">
            <AlertTriangle className="text-yellow-400" /> Alertas operativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertasActivas.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a2b2e] text-gray-400">
                  <th className="text-left py-2">Descripción</th>
                  <th>Prioridad</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {alertasActivas.map((a, i) => (
                  <tr key={i} className="border-b border-[#1a2b2e] hover:bg-[#0f2c2e]">
                    <td>{a.descripcion}</td>
                    <td className={`${a.prioridad === "ALTA" ? "text-red-400" : a.prioridad === "MEDIA" ? "text-yellow-400" : "text-green-400" } font-semibold`}>
                      {a.prioridad}
                    </td>
                    <td>{a.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400">Sin alertas registradas.</p>
          )}
        </CardContent>
      </Card>

      {/* Últimos viajes */}
      {/* Últimos viajes */}
<Card className="bg-[#111f24] border border-[#0f2c2e] rounded-2xl shadow-lg">
  <CardHeader className="flex flex-row items-center justify-between pb-3">
    <CardTitle className="text-[#00B8A9] flex items-center gap-2">
      <Truck className="w-5 h-5 text-[#00B8A9]" />
      Últimos viajes
    </CardTitle>
    <Link
      href="/viajes"
      className="text-sm text-[#00B8A9] hover:underline hover:text-[#00d9c6] transition"
    >
      Ver todos →
    </Link>
  </CardHeader>

  <CardContent className="overflow-x-auto">
    {ultimosViajes.length > 0 ? (
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[#1a2b2e] text-gray-400 uppercase tracking-wider text-xs">
            <th className="text-left py-2 px-3">Cliente</th>
            <th className="text-left py-2 px-3">Origen</th>
            <th className="text-left py-2 px-3">Destino</th>
            <th className="text-left py-2 px-3">Vehículo</th>
            <th className="text-center py-2 px-3">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {ultimosViajes.map((v: any, i: number) => (
            <tr
              key={v._id}
              className={`${
                i % 2 === 0 ? "bg-[#0f1c20]" : "bg-[#101e22]"
              } hover:bg-gradient-to-r hover:from-[#0f2c2e] hover:to-[#113f3a] transition-colors`}
            >
              <td className="py-2 px-3 font-medium text-[#e6f6f7]">
                {v.clienteNombre}
              </td>
              <td className="py-2 px-3 text-gray-300">{v.origen}</td>
              <td className="py-2 px-3 text-gray-300">{v.destino}</td>
              <td className="py-2 px-3 text-gray-400">
                {v.vehiculoNombre || "—"}
              </td>
              <td className="py-2 px-3 text-center text-gray-400">
                {new Date(v.creadoEn).toLocaleDateString("es-AR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p className="text-gray-400 text-sm italic">No hay viajes recientes registrados.</p>
    )}
  </CardContent>
 </Card>

      </div>
    </main>
  );
}

/* ========================================================
   🔹 Helpers
   ======================================================== */

// Label tipado para el Pie (evita error TS-2322/18046)
function renderGastoLabel({ name, value }: PieLabelRenderProps & { name?: string }) {
  const v = Number(value ?? 0);
  const n = name ?? "";
  return `${n}: ${v.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}`;
}

/* 🔹 Componente KPI Dinámico */
function KpiCard({
  title,
  value,
  icon,
  color = "teal",
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "teal" | "red" | "green";
}) {
  const styles = {
    teal: { border: "#0f2c2e", text: "#00B8A9" },
    red: { border: "#3a0f0f", text: "#ef4444" },
    green: { border: "#0f3a2c", text: "#22c55e" },
  }[color];

  return (
    <Card className="bg-[#111f24] border rounded-2xl transition hover:scale-[1.02]" style={{ borderColor: styles.border }}>
      <CardContent className="flex justify-between items-center p-6">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <h2 className="text-2xl font-bold mt-1 whitespace-nowrap" style={{ color: styles.text }}>
            {value}
          </h2>
        </div>
        <div className="p-3 rounded-xl" style={{ color: styles.text, backgroundColor: "#0f2c2e" }}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
