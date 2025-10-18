"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

type Estado = "PENDIENTE" | "PARCIAL" | "PAGADO" | "ANULADO" | "";
type Medio = "TRANSFERENCIA" | "EFECTIVO" | "CHEQUE" | "TARJETA" | "OTRO";

function cn(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

const moneyFmt = (moneda: string) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda || "ARS",
  });

export default function ComprobantesProvPage() {
  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState<Estado>("");
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState<any>(null);

  const comprobantes =
    (useQuery(api.comprobantes_prov.listar, {}) ?? []) as (Doc<"comprobantes_prov"> & {
      proveedorNombre?: string;
      tipoComprobanteNombre?: string;
    })[];

  const registrarPago = useMutation(api.comprobantes_prov.registrarPago);

  // 👉 estado local para métodos de pago
  const [pagos, setPagos] = useState<
    { medio: Medio; importe: number; notas?: string }[]
  >([{ medio: "EFECTIVO", importe: 0 }]);

  const handleOpenPago = (c: any) => {
    setComprobanteSeleccionado(c);
    setPagos([{ medio: "EFECTIVO", importe: c.saldo }]); // default: todo en efectivo
    setShowPagoModal(true);
  };

  const handleConfirmarPago = async () => {
    if (!comprobanteSeleccionado) return;

    await registrarPago({
      comprobanteId: comprobanteSeleccionado._id,
      pagos,
    });

    setShowPagoModal(false);
    setComprobanteSeleccionado(null);
  };

  const filtrados = useMemo(() => {
    let out = comprobantes;
    if (buscar.trim()) {
      const b = buscar.toLowerCase();
      out = out.filter((c) =>
        [c.numero, c.sucursal, c.letra, c.proveedorNombre ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(b)
      );
    }
    if (estado) out = out.filter((c) => c.estado === estado);
    return out;
  }, [comprobantes, buscar, estado]);

  const kpis = useMemo(() => {
    const totalPendiente = filtrados.reduce((a, c) => a + (c.saldo ?? 0), 0);
    const cantVencidas = filtrados.filter(
      (c) => c.estado !== "PAGADO" && c.fecha < new Date().toISOString()
    ).length;
    return { totalPendiente, cantVencidas };
  }, [filtrados]);

  if (!comprobantes) return <div className="p-6 text-neutral-300">Cargando…</div>;

  return (
    // CAMBIO 1: Fondo principal
    <div className="min-h-screen bg-[#0b1618] text-[#e6f6f7] p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comprobantes de Proveedor</h1>
        <div className="flex items-center gap-3">
          {/* Botón principal */}
          <Link
            href="/facturas/nueva"
            className="px-3 py-2 rounded-lg bg-[#36b6b0] text-white hover:bg-[#2ca6a4] font-semibold shadow-sm"
          >
            + Nuevo Comprobante
          </Link>
          {/* Historial de pagos */}
          
          {/* KPIs en header - CAMBIO 2: Fondo y borde de KPI boxes */}
          <div className="px-3 py-2 rounded bg-[#11292e] border border-[#1e3c42]">
            Pendiente: <b>{moneyFmt("ARS").format(kpis.totalPendiente)}</b>
          </div>
          <div className="px-3 py-2 rounded bg-[#11292e] border border-[#1e3c42]">
            Vencidas: <b>{kpis.cantVencidas}</b>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Input de búsqueda - CAMBIO 3: Fondo, borde y texto de input */}
        <input
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar Nº / sucursal / proveedor..."
          className="bg-[#11292e] text-sm px-3 py-2 rounded border border-[#1e3c42] w-64 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
        />
        {/* Select de estado - CAMBIO 4: Fondo, borde y texto de select */}
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value as Estado)}
          className="bg-[#11292e] text-sm px-3 py-2 rounded border border-[#1e3c42] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
        >
          <option value="">Todos</option>
          <option value="PENDIENTE">PENDIENTE</option>
          <option value="PARCIAL">PARCIAL</option>
          <option value="PAGADO">PAGADO</option>
          <option value="ANULADO">ANULADO</option>
        </select>
      </div>

      {/* Tabla - CAMBIO 5: Fondo, borde, header y filas */}
      <div className="bg-[#11292e] border border-[#1e3c42] rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-sm">
          {/* Header de la tabla */}
          <thead className="bg-[#1e3c42] text-[#9ed1cd]">
            <tr>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Comprobante</th>
              <th className="px-4 py-3 text-left">Proveedor</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Hora</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Saldo</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => {
              const m = moneyFmt("ARS");
              return (
                <tr key={c._id} className="border-t border-[#1e3c42] hover:bg-[#15393f] transition">
                  <td className="px-4 py-3">{c.letra}</td>
                  <td className="px-4 py-3">
                    {c.sucursal}-{c.numero}
                  </td>
                  <td className="px-4 py-3">{c.proveedorNombre ?? "(sin proveedor)"}</td>
                  <td className="px-4 py-3">
                    {new Date(c.fecha).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3">{c.hora ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "px-2 py-1 rounded border text-xs font-medium",
                        c.estado === "PAGADO" &&
                          "bg-green-700/40 border-green-600 text-green-300",
                        c.estado === "PARCIAL" &&
                          "bg-yellow-700/40 border-yellow-600 text-yellow-300",
                        // CAMBIO 6: Color de estado PENDIENTE
                        c.estado === "PENDIENTE" &&
                          "bg-[#1e3c42] border-[#2e5d65] text-[#d6f4f4]",
                        c.estado === "ANULADO" &&
                          "bg-red-800/40 border-red-600 text-red-300"
                      )}
                    >
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{m.format(c.total ?? 0)}</td>
                  <td className="px-4 py-3 text-right">{m.format(c.saldo ?? 0)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {/* Botón Ver Detalles - Mantengo el color de énfasis */}
                      <Link
                        href={`/facturas/${c._id}`}
                        className="px-3 py-1.5 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white text-xs font-medium transition"
                      >
                        Ver Detalles
                      </Link>
                      {c.estado !== "ANULADO" && c.estado !== "PAGADO" && (
                        <button className="px-3 py-1.5 rounded-lg bg-red-700/70 text-white hover:bg-red-600/80 text-xs font-medium transition">
                          Anular
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-neutral-400">
                  No hay comprobantes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de pago */}
      {showPagoModal && comprobanteSeleccionado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          {/* CAMBIO 7: Fondo y borde del Modal */}
          <div className="bg-[#11292e] p-6 rounded-xl shadow-2xl w-full max-w-lg space-y-4 border border-[#1e3c42]">
            <h2 className="text-xl font-bold text-[#e8f8f8]">
              Pagar comprobante {comprobanteSeleccionado.sucursal}-
              {comprobanteSeleccionado.numero}
            </h2>

            {pagos.map((pago, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                {/* CAMBIO 8: Fondo y borde de selects e inputs dentro del modal */}
                <select
                  value={pago.medio}
                  onChange={(e) => {
                    const updated = [...pagos];
                    updated[idx].medio = e.target.value as Medio;
                    setPagos(updated);
                  }}
                  className="bg-[#0b1618] text-white px-3 py-2 rounded-lg border border-[#1e3c42] focus:ring-[#36b6b0] focus:border-[#36b6b0] transition"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="OTRO">Otro</option>
                </select>
                <input
                  type="number"
                  value={pago.importe}
                  onChange={(e) => {
                    const updated = [...pagos];
                    updated[idx].importe = parseFloat(e.target.value) || 0;
                    setPagos(updated);
                  }}
                  className="bg-[#0b1618] text-white px-3 py-2 rounded-lg border border-[#1e3c42] w-32 focus:ring-[#36b6b0] focus:border-[#36b6b0] transition"
                />
                <button
                  onClick={() => setPagos(pagos.filter((_, i) => i !== idx))}
                  className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-[#1e3c42] transition"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              onClick={() => setPagos([...pagos, { medio: "EFECTIVO", importe: 0 }])}
              className="px-3 py-2 rounded-lg bg-[#36b6b0] text-white hover:bg-[#2ca6a4] font-medium transition"
            >
              + Agregar método
            </button>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPagoModal(false)}
                // CAMBIO 9: Botón Cancelar
                className="px-4 py-2 rounded-lg bg-[#1e3c42] text-white hover:bg-[#2e5d65] transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarPago}
                // Botón Confirmar Pago - Mantiene color de éxito/énfasis
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition font-medium"
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
