"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Truck,
  TrendingUp,
  Wallet,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

/* 🎨 Paleta y estilos base */
const COLORS = ["#00B8A9", "#007F73", "#00D1C1", "#004F47"];

export default function DashboardPage() {
  // 🔹 Datos desde Convex
  const vehiculos = useQuery(api.vehiculos.listar, {}) ?? [];
  const facturas = useQuery(api.facturas_ventas.listarConCliente, {}) ?? [];
  const viajes = useQuery(api.viajes.listarConNombres, {}) ?? [];
  const clientesVentas = useQuery(api.clientes_ventas.listar, { busqueda: "" } as any) ?? [];

  // 🔹 Calcular estadísticas
  const totalVehiculos = vehiculos.length;
  const totalViajes = viajes.length;
  const totalFacturado = useMemo(
    () => facturas.reduce((acc: number, f: any) => acc + (f.total || 0), 0),
    [facturas]
  );

  const totalPendiente = facturas
    .filter((f: any) => f.estado === "PENDIENTE")
    .reduce((acc: number, f: any) => acc + (f.total || 0), 0);

  // 🔹 Gráfico de ingresos mensuales
  const ingresosMensuales = useMemo(() => {
    const data: Record<string, number> = {};
    facturas.forEach((f: any) => {
      const mes = new Date(f.creadoEn).toLocaleString("es-AR", { month: "short" });
      data[mes] = (data[mes] || 0) + (f.total || 0);
    });
    return Object.entries(data).map(([mes, total]) => ({ mes, total }));
  }, [facturas]);

  // 🔹 Estado de flota
  const estadoFlota = useMemo(() => {
    const counts: Record<string, number> = {};
    vehiculos.forEach((v: any) => {
      counts[v.estado] = (counts[v.estado] || 0) + 1;
    });
    return Object.entries(counts).map(([estado, cantidad]) => ({
      estado,
      cantidad,
    }));
  }, [vehiculos]);

  // 🔹 Helper: últimos N meses continuos con etiqueta corta
  function lastNMonths(n: number) {
    const out: { key: string; label: string; year: number; month: number }[] = [];
    const d = new Date();
    d.setDate(1);
    for (let i = n - 1; i >= 0; i--) {
      const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
      out.push({
        key: `${dt.getFullYear()}-${dt.getMonth() + 1}`,
        label: dt.toLocaleString("es-AR", { month: "short" }),
        year: dt.getFullYear(),
        month: dt.getMonth(),
      });
    }
    return out;
  }

  // 🔹 Serie continua de viajes realizados por mes (últimos 12)
  const viajesMensuales = useMemo(() => {
    const base = lastNMonths(12);
    const counts: Record<string, number> = {};
    viajes.forEach((v: any) => {
      const t = new Date(v.creadoEn || v.fecha || Date.now());
      const key = `${t.getFullYear()}-${t.getMonth() + 1}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return base.map((m) => ({ mes: m.label, cantidad: counts[m.key] || 0 }));
  }, [viajes]);

  // 🔹 Serie continua de clientes creados por mes (últimos 12)
  const clientesMensuales = useMemo(() => {
    const base = lastNMonths(12);
    const counts: Record<string, number> = {};
    clientesVentas.forEach((c: any) => {
      const t = new Date(c.creadoEn || Date.now());
      const key = `${t.getFullYear()}-${t.getMonth() + 1}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return base.map((m) => ({ mes: m.label, cantidad: counts[m.key] || 0 }));
  }, [clientesVentas]);

  return (
    <main className="min-h-screen bg-[#0d1b1e] text-[#e6f6f7] p-8 space-y-8">
      {/* 🔷 Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-[#00B8A9]">Panel General</h1>
        <p className="text-sm text-gray-400">
          Última actualización:{" "}
          {new Date().toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* 🔹 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Vehículos activos"
          value={totalVehiculos}
          icon={<Truck className="text-[#00B8A9]" />}
        />
        <KpiCard
          title="Viajes realizados"
          value={totalViajes}
          icon={<TrendingUp className="text-[#00B8A9]" />}
        />
        <KpiCard
          title="Facturación total"
          value={`$ ${totalFacturado.toLocaleString("es-AR")}`}
          icon={<DollarSign className="text-[#00B8A9]" />}
        />
        <KpiCard
          title="Pendiente de cobro"
          value={`$ ${totalPendiente.toLocaleString("es-AR")}`}
          icon={<Wallet className="text-[#00B8A9]" />}
        />
      </div>

      {/* 🔹 Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 📊 Ingresos Mensuales */}
        <Card className="bg-[#111f24] border border-[#0f2c2e] text-[#e6f6f7] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#00B8A9]">
              Ingresos mensuales
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ingresosMensuales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2b2e" />
                <XAxis dataKey="mes" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip
                  cursor={{ fill: "#1a2b2e" }}
                  contentStyle={{
                    backgroundColor: "#0f2c2e",
                    border: "none",
                    color: "#e6f6f7",
                  }}
                />
                <Bar dataKey="total" fill="#00B8A9" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 🥧 Estado de Flota */}
        <Card className="bg-[#111f24] border border-[#0f2c2e] text-[#e6f6f7] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#00B8A9]">
              Estado de flota
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
  data={estadoFlota}
  dataKey="cantidad"
  nameKey="estado"
  outerRadius={100}
  label={({ name, value }) => `${name}: ${value}`}
>
  {estadoFlota.map((_, i) => (
    <Cell key={i} fill={COLORS[i % COLORS.length]} />
  ))}
</Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f2c2e",
                    border: "none",
                    color: "#e6f6f7",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 🔹 Series continuas: Viajes y Clientes por mes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 📈 Viajes realizados */}
        <Card className="bg-[#111f24] border border-[#0f2c2e] text-[#e6f6f7] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#00B8A9]">
              Viajes realizados (últimos 12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viajesMensuales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2b2e" />
                <XAxis dataKey="mes" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: "#00B8A9" }}
                  contentStyle={{ backgroundColor: "#0f2c2e", border: "none", color: "#e6f6f7" }}
                />
                <Line type="monotone" dataKey="cantidad" stroke="#00B8A9" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 📈 Clientes creados */}
        <Card className="bg-[#111f24] border border-[#0f2c2e] text-[#e6f6f7] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#00B8A9]">
              Clientes (últimos 12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={clientesMensuales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2b2e" />
                <XAxis dataKey="mes" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: "#00B8A9" }}
                  contentStyle={{ backgroundColor: "#0f2c2e", border: "none", color: "#e6f6f7" }}
                />
                <Line type="monotone" dataKey="cantidad" stroke="#00B8A9" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 🔹 Tabla resumen */}
      <Card className="bg-[#111f24] border border-[#0f2c2e] text-[#e6f6f7] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#00B8A9] flex justify-between items-center">
            Últimas facturas
            <Link
              href="/facturas-ventas"
              className="text-sm text-[#00B8A9] hover:underline"
            >
              Ver todas →
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[#1a2b2e] text-gray-400">
                <th className="py-2">N°</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {facturas.slice(0, 5).map((f: any) => (
                <tr
                  key={f._id}
                  className="border-b border-[#1a2b2e] hover:bg-[#0f2c2e] transition-colors"
                >
                  <td className="py-2">{f.numero}</td>
                  <td>{f.clienteRazonSocial || f.clienteAlias}</td>
                  <td>
                    {new Date(f.creadoEn).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    })}
                  </td>
                  <td>${f.total?.toLocaleString("es-AR")}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        f.estado === "PAGADO"
                          ? "bg-[#004F47] text-[#00D1C1]"
                          : f.estado === "PENDIENTE"
                          ? "bg-[#3b2a20] text-[#fbbf24]"
                          : "bg-[#2a1a1a] text-[#ef4444]"
                      }`}
                    >
                      {f.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}

/* 🔹 Componente KPI */
function KpiCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="bg-[#111f24] border border-[#0f2c2e] rounded-2xl text-[#e6f6f7] transition hover:scale-[1.02] hover:border-[#00B8A9]/50">
      <CardContent className="flex justify-between items-center p-6">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <h2 className="text-2xl font-bold mt-1">{value}</h2>
        </div>
        <div className="p-3 bg-[#0f2c2e] rounded-xl">{icon}</div>
      </CardContent>
    </Card>
  );
}
