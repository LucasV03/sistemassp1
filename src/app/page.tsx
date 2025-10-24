"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const BusMap = dynamic(() => import("../components/BusMap"), { ssr: false });

export default function Home() {
  // Datos reales desde Convex
  const vehStats = useQuery(api.vehiculos.estadisticas, {}) as
    | { total: number; operativos: number; mantenimiento: number; fuera: number }
    | undefined;
  const viaStats = useQuery(api.viajes.estadisticas, {}) as
    | { total: number; finalizados: number; enCurso: number; pendientes: number }
    | undefined;
  const mantStats = useQuery(api.mantenimientos.estadisticas, {}) as
    | { total: number; pendientes: number; enCurso: number; finalizados: number }
    | undefined;
  const comprobantes = (useQuery(api.comprobantes_prov.listar, {}) ?? []) as any[];
  const pagos = (useQuery(api.pagos_comprobantes.listar, {}) ?? []) as any[];
  const viajes = (useQuery(api.viajes.listarConNombres, {}) ?? []) as any[];

  const kpis = useMemo(() => {
    const pendientes = comprobantes.filter((c) => c.estado !== "PAGADO");
    const totalPendiente = pendientes.reduce((a, c) => a + (c.saldo ?? 0), 0);
    return [
      { label: "Vehículos operativos", value: `${vehStats?.operativos ?? 0} / ${vehStats?.total ?? 0}` },
      { label: "Viajes en curso", value: viaStats?.enCurso ?? 0 },
      { label: "Mantenimientos", value: mantStats?.pendientes ?? 0 },
      { label: "Pendiente a pagar", value: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(totalPendiente) },
    ];
  }, [vehStats, viaStats, mantStats, comprobantes]);

  return (
    // Fondo principal: Usamos el color oscuro `#0b1618`
    <main className="min-h-screen bg-[#0b1618] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Encabezado */}
      {/* Tarjeta ajustada a la estética oscura */}
      <header className="rounded-xl border border-[#1e3c42] bg-[#11292e] p-5 text-center shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white">
          Panel operativo
        </h1>
        <p className="text-sm sm:text-base text-gray-400">
          Estado actual de flota, viajes e incidencias
        </p>
      </header>

      {/* KPIs (flex + wrap) */}
      <section className="flex flex-wrap gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="
              flex-1 basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)]
              min-w-[220px]
              rounded-xl border border-[#1e3c42] 
              bg-[#11292e] p-4 shadow-lg
            "
          >
            <div className="text-xs uppercase tracking-wide text-gray-400">
              {k.label || "\u00A0"}
            </div>
            <div className="mt-1 text-2xl font-semibold text-white">
              {k.value}
            </div>
          </div>
        ))}
      </section>

      {/* Dos columnas con flex (col -> row en xl) */}
      <section className="flex flex-col gap-6">
        <div className="flex-1 flex flex-col gap-4">
          {/* Últimos viajes */}
          <Card title="Últimos viajes">
            <div className="max-h-40 overflow-y-auto rounded-xl border border-[#1e3c42]">
              <table className="min-w-full text-sm">
                {/* Encabezado de la tabla ajustado */}
                <thead className="sticky top-0 bg-[#1e3c42] text-gray-400 text-xs">
                  <tr>
                    <Th>Cliente</Th>
                    <Th>Chofer</Th>
                    <Th>Ruta</Th>
                    <Th>Estado</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e3c42]">
                  {viajes.slice(0, 8).map((v: any, i: number) => (
                    <tr key={i} className="hover:bg-[#1a3035]">
                      <Td className="font-medium text-white">{v.clienteNombre ?? "—"}</Td>
                      <Td className="text-gray-300">{v.choferNombre ?? "—"}</Td>
                      <Td className="text-gray-300">{`${v.origen ?? "?"} → ${v.destino ?? "?"}`}</Td>
                      <Td>
                        <span
                          className={[
                            "rounded-full px-2 py-0.5 text-xs ring-1 font-semibold",
                            v.estado === "FINALIZADO"
                              ? "bg-emerald-800/20 text-emerald-400 ring-emerald-700/30"
                              : v.estado === "EN_CURSO"
                              ? "bg-sky-800/20 text-sky-300 ring-sky-700/30"
                              : v.estado === "PENDIENTE"
                              ? "bg-amber-800/20 text-amber-400 ring-amber-700/30"
                              : "bg-gray-700/20 text-gray-400 ring-gray-600/30"
                          ].join(" ")}
                        >
                          {v.estado}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagos recientes debajo de Últimos viajes, ancho completo */}
          <Card title="Pagos recientes">
            <div className="max-h-40 overflow-y-auto rounded-xl border border-[#1e3c42]">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-[#1e3c42] text-gray-400 text-xs">
                  <tr>
                    <Th>Proveedor</Th>
                    <Th>Fecha</Th>
                    <Th>Medio</Th>
                    <Th className="text-right">Importe</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e3c42]">
                  {pagos.slice(0, 8).map((p: any) => (
                    <tr key={p._id} className="hover:bg-[#1a3035]">
                      <Td className="text-white">{p.proveedorNombre ?? "—"}</Td>
                      <Td className="text-gray-300">{new Date(p.fechaPago).toLocaleDateString("es-AR")}</Td>
                      <Td className="text-gray-300">{p.medio}</Td>
                      <Td className="text-right text-gray-200">
                        {p.importe?.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                      </Td>
                    </tr>
                  ))}
                  {pagos.length === 0 && (
                    <tr><Td className="text-gray-400">No hay pagos aún.</Td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Resúmenes */}
          <div className="flex flex-wrap gap-4">
            <Card
              title="Resumen de mantenimiento"
              className="flex-1 basis-full md:basis-[calc(50%-0.5rem)] min-w-[260px]"
            >
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Pendientes: <b>{mantStats?.pendientes ?? 0}</b></li>
                <li>En curso: <b>{mantStats?.enCurso ?? 0}</b></li>
                <li>Finalizados: <b>{mantStats?.finalizados ?? 0}</b></li>
                <li>Total: <b>{mantStats?.total ?? 0}</b></li>
              </ul>
            </Card>

            <Card
              title="Comprobantes y pagos"
              className="flex-1 basis-full md:basis-[calc(50%-0.5rem)] min-w-[260px]"
            >
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Comprobantes: <b>{comprobantes.length}</b></li>
                <li>Pagos registrados: <b>{pagos.length}</b></li>
                <li>
                  Último pago: <b>{pagos[0] ? new Date(pagos[0].fechaPago).toLocaleString("es-AR") : "—"}</b>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}



// Componente Card ajustado a la estética oscura
function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        // Usamos el color de caja/fondo secundario: `#11292e` y borde `#1e3c42`
        "rounded-xl border border-[#1e3c42]",
        "bg-[#11292e] p-4 shadow-lg",
        className,
      ].join(" ")}
    >
      <div className="mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-white">
          {title}
        </h2>
      </div>
      <div className="text-gray-300">
        {children}
      </div>
    </section>
  );
}

// Th ajustado al texto oscuro
function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={["px-3 py-2 text-left font-medium", className].join(" ")}>
      {children}
    </th>
  );
}

// Td ajustado al texto oscuro
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={["px-3 py-2 text-gray-300", className].join(" ")}>
      {children}
    </td>
  );
}
