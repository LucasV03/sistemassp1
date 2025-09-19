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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Comprobantes de Proveedor</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/facturas/nueva"
            className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500"
          >
            + Nuevo Comprobante
          </Link>
          <div className="px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-neutral-200">
            Pendiente: <b>{moneyFmt("ARS").format(kpis.totalPendiente)}</b>
          </div>
          <div className="px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-neutral-200">
            Vencidas: <b>{kpis.cantVencidas}</b>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar Nº / sucursal / proveedor..."
          className="bg-neutral-900 text-sm px-3 py-2 rounded border border-neutral-700 w-64 text-neutral-100"
        />
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value as Estado)}
          className="bg-neutral-900 text-sm px-3 py-2 rounded border border-neutral-700 text-neutral-100"
        >
          <option value="">Todos</option>
          <option value="PENDIENTE">PENDIENTE</option>
          <option value="PARCIAL">PARCIAL</option>
          <option value="PAGADO">PAGADO</option>
          <option value="ANULADO">ANULADO</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="rounded-md border border-neutral-800 overflow-hidden text-zinc-400">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-zinc-300">
            <tr>
              <th className="px-4 py-2 text-left">Tipo</th>
              <th className="px-4 py-2 text-left">Comprobante</th>
              <th className="px-4 py-2 text-left">Proveedor</th>
              <th className="px-4 py-2 text-left">Fecha</th>
              <th className="px-4 py-2 text-left">Hora</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-right">Total</th>
              <th className="px-4 py-2 text-right">Saldo</th>
              <th className="px-4 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => {
              const m = moneyFmt("ARS");
              return (
                <tr key={c._id} className="border-t border-neutral-800">
                  <td className="px-4 py-2">{c.letra}</td>
                  <td className="px-4 py-2">
                    {c.sucursal}-{c.numero}
                  </td>
                  <td className="px-4 py-2">{c.proveedorNombre ?? "(sin proveedor)"}</td>
                  <td className="px-4 py-2">
                    {new Date(c.fecha).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-2">{c.hora ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "px-2 py-1 rounded border",
                        c.estado === "PAGADO" &&
                          "bg-green-700/40 border-green-600 text-green-100",
                        c.estado === "PARCIAL" &&
                          "bg-yellow-700/40 border-yellow-600 text-yellow-100",
                        c.estado === "PENDIENTE" &&
                          "bg-neutral-800 border-neutral-600 text-neutral-200",
                        c.estado === "ANULADO" &&
                          "bg-red-800/40 border-red-600 text-red-100"
                      )}
                    >
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">{m.format(c.total ?? 0)}</td>
                  <td className="px-4 py-2 text-right">{m.format(c.saldo ?? 0)}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/facturas/${c._id}`}
                        className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                      >
                        Ver Detalles
                      </Link>
                      {c.estado !== "ANULADO" && c.estado !== "PAGADO" && (
                        <>
                          <button
                            onClick={() => handleOpenPago(c)}
                            className="px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                          >
                            Pagar
                          </button>
                          <button className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-500">
                            Anular
                          </button>
                        </>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 p-6 rounded-lg shadow-lg w-full max-w-lg space-y-4 border border-neutral-700">
            <h2 className="text-lg font-bold text-white">
              Pagar comprobante {comprobanteSeleccionado.sucursal}-
              {comprobanteSeleccionado.numero}
            </h2>

            {pagos.map((pago, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select
                  value={pago.medio}
                  onChange={(e) => {
                    const updated = [...pagos];
                    updated[idx].medio = e.target.value as Medio;
                    setPagos(updated);
                  }}
                  className="bg-neutral-800 text-white px-2 py-1 rounded border border-neutral-600"
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
                  className="bg-neutral-800 text-white px-2 py-1 rounded border border-neutral-600 w-32"
                />
                <button
                  onClick={() => setPagos(pagos.filter((_, i) => i !== idx))}
                  className="text-red-400 hover:text-red-200"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              onClick={() => setPagos([...pagos, { medio: "EFECTIVO", importe: 0 }])}
              className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
            >
              + Agregar método
            </button>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPagoModal(false)}
                className="px-3 py-2 rounded bg-neutral-700 text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarPago}
                className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-500"
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
