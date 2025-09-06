
"use client";

import dynamic from "next/dynamic";
import type { Bus } from "../components/BusMap";


const BusMap = dynamic(() => import("../components/BusMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full rounded-lg bg-slate-100 dark:bg-neutral-800 animate-pulse" />
  ),
});

export default function Home() {
  
  const KPIS = [
    { label: "Unidades activas", value: "42 / 58" },
    { label: "Puntualidad", value: "92%" },
    { label: "Alertas abiertas", value: "3" },
    { label: "", value: "........." },
  ];

  const PRIORIDADES = [
    "Incidencia crítica: BUS-214 – lectora SUBE intermitente",
    "Demora por tráfico en Ruta C→D – ajustar frecuencia",
    "Unidad BUS-031 entra a mantenimiento hoy 18:00",
  ];

  const VIAJES_HOY = [
    { unidad: "BUS-102", ruta: "A → B", salida: "12:30", estado: "A tiempo" },
    { unidad: "BUS-088", ruta: "C → D", salida: "12:45", estado: "Demora 5’" },
    { unidad: "BUS-031", ruta: "E → A", salida: "13:10", estado: "A tiempo" },
    { unidad: "BUS-214", ruta: "B → C", salida: "13:30", estado: "Reasignado" },
    { unidad: "BUS-131", ruta: "Terminal → Norte", salida: "13:45", estado: "A tiempo" },
    { unidad: "BUS-077", ruta: "Sur → Centro", salida: "14:00", estado: "Demora 10’" },
  ];

  const FUERA_SERVICIO = [
    { unidad: "BUS-214", motivo: "Lectora SUBE", estado: "Diagnóstico" },
    { unidad: "BUS-031", motivo: "Mantenimiento programado", estado: "18:00" },
  ];

  const INCIDENCIAS = [
    { sev: "Alta", texto: "Demora en Acceso Norte (obras)" },
    { sev: "Media", texto: "Parada 123 sin luz – reportada" },
    { sev: "Baja", texto: "Cartelería desactualizada en Ruta E" },
  ];

  const PERSONAL = [
    "2 choferes sin asignación para la franja 14–16 h",
    "Ausencia reportada: J. Pérez (turno tarde)",
    "Vencimiento licencia: M. Gómez (30 días)",
  ];

  const BUSES: Bus[] = [
    { id: "BUS-102", lat: -24.787, lng: -65.41, route: "A → B", speedKmH: 38, heading: 45, updatedAt: new Date().toISOString() },
    { id: "BUS-088", lat: -24.8, lng: -65.44, route: "C → D", speedKmH: 22, heading: 320, updatedAt: new Date().toISOString() },
    { id: "BUS-031", lat: -24.775, lng: -65.43, route: "E → A", speedKmH: 41, heading: 190, updatedAt: new Date().toISOString() },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Encabezado */}
      <header className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          Panel operativo
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
          Estado actual de flota, viajes e incidencias
        </p>
      </header>

      {/* KPIs (flex + wrap) */}
      <section className="flex flex-wrap gap-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="
              flex-1 basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)]
              min-w-[220px]
              rounded-xl border border-neutral-200 dark:border-neutral-800
              bg-white dark:bg-neutral-900 p-4 shadow-sm
            "
          >
            <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {k.label || "\u00A0"}
            </div>
            <div className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {k.value}
            </div>
          </div>
        ))}
      </section>

      {/* Dos columnas con flex (col -> row en xl) */}
      <section className="flex flex-col xl:flex-row gap-6">
        {/* Columna principal */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Prioridades */}
          <Card title="Prioridades de hoy">
            <ul className="list-disc pl-5 space-y-1 text-neutral-700 dark:text-neutral-300">
              {PRIORIDADES.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </Card>

          {/* Salidas próximas */}
          <Card title="Salidas próximas (hoy)">
            <div className="max-h-40 overflow-y-auto rounded border border-neutral-200 dark:border-neutral-800">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 text-xs">
                  <tr>
                    <Th>Unidad</Th>
                    <Th>Ruta</Th>
                    <Th>Salida</Th>
                    <Th>Estado</Th>
                  </tr>
                </thead>
                <tbody>
                  {VIAJES_HOY.map((v, i) => (
                    <tr key={i} className="border-t border-neutral-200 dark:border-neutral-800">
                      <Td className="font-medium text-neutral-900 dark:text-neutral-100">{v.unidad}</Td>
                      <Td>{v.ruta}</Td>
                      <Td>{v.salida}</Td>
                      <Td>
                        <span
                          className={[
                            "rounded-full px-2 py-0.5 text-xs ring-1",
                            v.estado.includes("Demora") ? "bg-amber-100 text-amber-700 ring-amber-200" :
                            v.estado.includes("Reasignado") ? "bg-neutral-100 text-neutral-700 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700" :
                            "bg-emerald-100 text-emerald-700 ring-emerald-200"
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

          {/* Incidencias + Personal (flex responsivo) */}
          <div className="flex flex-wrap gap-4">
            <Card
              title="Incidencias"
              className="flex-1 basis-full md:basis-[calc(50%-0.5rem)] min-w-[260px]"
            >
              <ul className="space-y-2 text-sm">
                {INCIDENCIAS.map((i, idx) => (
                  <li key={idx} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-2">
                    <span
                      className={[
                        "mr-2 rounded px-2 py-0.5 text-xs ring-1",
                        i.sev === "Alta"
                          ? "bg-rose-100 text-rose-700 ring-rose-200"
                          : i.sev === "Media"
                          ? "bg-amber-100 text-amber-700 ring-amber-200"
                          : "bg-neutral-100 text-neutral-700 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700",
                      ].join(" ")}
                    >
                      {i.sev}
                    </span>
                    {i.texto}
                  </li>
                ))}
                {INCIDENCIAS.length === 0 && (
                  <li className="text-neutral-500 dark:text-neutral-400">Sin incidencias.</li>
                )}
              </ul>
            </Card>

            <Card
              title="Personal"
              className="flex-1 basis-full md:basis-[calc(50%-0.5rem)] min-w-[260px]"
            >
              <ul className="list-disc pl-5 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                {PERSONAL.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </Card>
          </div>
        </div>

        {/* Columna lateral */}
        <aside className="w-full xl:w-96 flex flex-col gap-6">
          <Card title="Mapa — flota en vivo">
            <div className="h-[420px]">
              <BusMap buses={BUSES} />
            </div>
          </Card>

          <Card title="Flota — fuera de servicio">
            <ul className="space-y-2 text-sm">
              {FUERA_SERVICIO.map((u) => (
                <li key={u.unidad} className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 p-2">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{u.unidad}</span>
                  <span className="text-neutral-600 dark:text-neutral-300">{u.motivo} — {u.estado}</span>
                </li>
              ))}
              {FUERA_SERVICIO.length === 0 && (
                <li className="text-neutral-500 dark:text-neutral-400">Sin novedades.</li>
              )}
            </ul>
          </Card>
        </aside>
      </section>
    </main>
  );
}



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
        "rounded-xl border border-neutral-200 dark:border-neutral-800",
        "bg-white dark:bg-neutral-900 p-4 shadow-sm",
        className,
      ].join(" ")}
    >
      <div className="mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h2>
      </div>
      <div className="text-neutral-700 dark:text-neutral-300">
        {children}
      </div>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left font-medium">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={["px-3 py-2 text-neutral-700 dark:text-neutral-300", className].join(" ")}>
      {children}
    </td>
  );
}
