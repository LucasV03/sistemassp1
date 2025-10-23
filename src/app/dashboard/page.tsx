"use client";

import { useMemo } from "react";
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

/* 🎨 Paletas */
const COLORS = ["#00B8A9", "#007F73", "#00D1C1", "#004F47"];
const GASTOS_COLORS = ["#14b8a6", "#f59e0b", "#3b82f6", "#ef4444"];

/* ===========================================
   🔹 DASHBOARD PAGE DINÁMICO
   =========================================== */
export default function DashboardPage() {
  // 🔹 Consultas reales desde Convex
  const vehiculos = useQuery(api.vehiculos.listar, {}) ?? [];
  const facturas = useQuery(api.facturas_ventas.listarConCliente, {}) ?? [];
  const comprobantes = useQuery(api.comprobantes_prov.listar, {}) ?? [];
  const viajes = useQuery(api.viajes.listarConNombres, {}) ?? [];
  const choferes = useQuery(api.choferes.listar, {}) ?? [];
  const clientes = useQuery(api.clientes_ventas.listar, {}) ?? [];
  const proveedores = useQuery(api.proveedores.listar, {}) ?? [];

  /* ========================================================
     📊 CÁLCULOS DINÁMICOS
     ======================================================== */

  // — Totales
  const totalFacturado = facturas.reduce((a: number, f: any) => a + (f.total || 0), 0);
  const totalEgresos = comprobantes
    .filter((c: any) => c.estado === "PAGADO")
    .reduce((a: number, c: any) => a + (c.total || 0), 0);
  const totalPendiente = facturas
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

  // — Balance mensual (ingresos / egresos / neto)
  const balanceMensual = useMemo(() => {
    const data: Record<string, { mes: string; ingresos: number; egresos: number; neto: number }> =
      {};

    const add = (fecha: number | string, tipo: "ingresos" | "egresos", total: number) => {
      const mes = new Date(fecha).toLocaleString("es-AR", { month: "short" });
      if (!data[mes]) data[mes] = { mes, ingresos: 0, egresos: 0, neto: 0 };
      data[mes][tipo] += total;
    };

    facturas.forEach((f: any) => add(f.creadoEn, "ingresos", f.total || 0));
    comprobantes
      .filter((c: any) => c.estado === "PAGADO")
      .forEach((c: any) => add(c.creadoEn, "egresos", c.total || 0));

    Object.values(data).forEach((d) => (d.neto = d.ingresos - d.egresos));
    return Object.values(data).sort(
  (a, b) =>
    new Date(`2025-${a.mes}-01`).getTime() - new Date(`2025-${b.mes}-01`).getTime()
);
  }, [facturas, comprobantes]);

  // — Distribución de gastos (dinámica desde tipo de comprobante)
  const gastosDistribucion = useMemo(() => {
    const agrupado: Record<string, number> = {};
    comprobantes
      .filter((c: any) => c.estado === "PAGADO")
      .forEach((c: any) => {
        const tipo = c.tipoComprobanteNombre || "Otros";
        agrupado[tipo] = (agrupado[tipo] || 0) + (c.total || 0);
      });
    return Object.entries(agrupado).map(([nombre, valor]) => ({ nombre, valor }));
  }, [comprobantes]);

  // — Rendimiento de rutas (dinámico desde viajes)
  const rendimientoRutas = useMemo(() => {
    const agrupado: Record<string, number[]> = {};
    viajes.forEach((v: any) => {
      const ruta = `${v.origen} - ${v.destino}`;
      if (!agrupado[ruta]) agrupado[ruta] = [];
      // tu modelo expone 'distanciaKm' (no 'km')
      agrupado[ruta].push(v.distanciaKm || 0);
    });
    return Object.entries(agrupado).map(([ruta, kms]) => ({
      ruta,
      kmPromedio: kms.length ? Math.round(kms.reduce((a, b) => a + b, 0) / kms.length) : 0,
    }));
  }, [viajes]);

  // — Últimos viajes
  const ultimosViajes = useMemo(
    () =>
      [...viajes]
        .sort((a: any, b: any) => (b.creadoEn || 0) - (a.creadoEn || 0))
        .slice(0, 5),
    [viajes]
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#00B8A9]">Dashboard Ejecutivo</h1>
        <p className="text-sm text-gray-400">
          Última actualización: {new Date().toLocaleDateString("es-AR")}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-6">
        <KpiCard title="Vehículos" value={totalVehiculos} icon={<Truck />} />
        <KpiCard title="Viajes" value={totalViajes} icon={<TrendingUp />} />
        <KpiCard title="Facturación total" value={`$ ${totalFacturado.toLocaleString("es-AR")}`} icon={<DollarSign />} />
        <KpiCard title="Egresos pagados" value={`$ ${totalEgresos.toLocaleString("es-AR")}`} icon={<Wallet />} color="red" />
        <KpiCard
          title="Ganancia neta"
          value={`$ ${totalGanancia.toLocaleString("es-AR")}`}
          icon={<BarChart3 />}
          color={totalGanancia >= 0 ? "green" : "red"}
        />
        <KpiCard title="Tasa de utilización" value={`${tasaUtilizacion}%`} icon={<Truck />} />
      </div>

      {/* Balance mensual */}
      <Card className="bg-[#111f24] border border-[#0f2c2e] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-[#00B8A9]">Balance financiero mensual</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={balanceMensual}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2b2e" />
              <XAxis dataKey="mes" stroke="#a3a3a3" />
              <YAxis stroke="#a3a3a3" />
              <Tooltip contentStyle={{ backgroundColor: "#0f2c2e", border: "none", color: "#e6f6f7" }} />
              <Line type="monotone" dataKey="ingresos" stroke="#00B8A9" strokeWidth={2} />
              <Line type="monotone" dataKey="egresos" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="neto" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gastos y rutas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de gastos */}
        <Card className="bg-[#111f24] border border-[#0f2c2e] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-[#00B8A9]">Distribución de gastos</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
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
                <Tooltip contentStyle={{ backgroundColor: "#0f2c2e", border: "none", color: "#e6f6f7" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rendimiento de rutas */}
        <Card className="bg-[#111f24] border border-[#0f2c2e] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-[#00B8A9]">Rendimiento de rutas</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rendimientoRutas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2b2e" />
                <XAxis dataKey="ruta" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip contentStyle={{ backgroundColor: "#0f2c2e", border: "none", color: "#e6f6f7" }} />
                <Bar dataKey="kmPromedio" fill="#00B8A9" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
          <h2 className="text-2xl font-bold mt-1" style={{ color: styles.text }}>
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
