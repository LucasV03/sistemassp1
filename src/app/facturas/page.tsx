// src/app/(panel)/facturas/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

type Estado = "PENDIENTE" | "PARCIAL" | "PAGADA" | "ANULADA" | "";

function cn(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

const moneyFmt = (moneda: string) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: moneda || "ARS" });

export default function FacturasProvPage() {
  // Filtros
  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState<Estado>("");
  const [desde, setDesde] = useState<string>("");
  const [hasta, setHasta] = useState<string>("");

  // UI modales
  const [openNueva, setOpenNueva] = useState(false);
  const [openPagar, setOpenPagar] = useState<null | string>(null);
  const [openConfirmAnular, setOpenConfirmAnular] = useState<null | string>(null);

  // Data (tipado explícito para evitar any)
  const facturas = useQuery(api.facturas_prov.listar, {
    buscar: buscar || undefined,
    estado: (estado || undefined) as any,
    desde: desde || undefined,
    hasta: hasta || undefined,
  }) as Doc<"facturas_prov">[] | undefined;

  // Mutations
  const crearDesdeOC = useMutation(api.facturas_prov.crearDesdeOC);
  const registrarPago = useMutation(api.facturas_prov.registrarPago);
  const anular = useMutation(api.facturas_prov.anular);

  const kpis = useMemo(() => {
    if (!facturas) return { totalPendiente: 0, cantVencidas: 0 };
    const nowISO = new Date().toISOString();
    const totalPendiente = facturas.reduce((a, f) => a + (f.saldo ?? 0), 0);
    const cantVencidas = facturas.filter(
      (f) => f.estado !== "PAGADA" && f.fechaVencimiento && f.fechaVencimiento < nowISO
    ).length;
    return { totalPendiente, cantVencidas };
  }, [facturas]);

  if (!facturas) return <div className="p-6 text-neutral-300">Cargando…</div>;

  // ---------- handlers (onSubmit) ----------
  const onNuevaDesdeOCSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const ocId = String(form.get("ocId") || "");
    const numeroProveedor = String(form.get("numeroProveedor") || "");
    const fechaEmisionInput = String(form.get("fechaEmision") || "");
    const fechaVencimientoInput = String(form.get("fechaVencimiento") || "");
    const notas = String(form.get("notas") || "");

    if (!ocId || !numeroProveedor || !fechaEmisionInput) {
      alert("OC, Nº de factura y fecha de emisión son obligatorios.");
      return;
    }

    await crearDesdeOC({
      ocId: ocId as any,
      numeroProveedor,
      fechaEmision: new Date(fechaEmisionInput).toISOString(),
      fechaVencimiento: fechaVencimientoInput
        ? new Date(fechaVencimientoInput).toISOString()
        : undefined,
      notas: notas || undefined,
    });

    setOpenNueva(false);
    e.currentTarget.reset();
  };

  const onPagarSubmit =
  (facturaId: string) =>
  async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 👇 guarda referencia al form ANTES de cualquier await o unmount
    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    const fechaPagoInput = String(form.get("fechaPago") || "");
    const medio = String(form.get("medio") || "TRANSFERENCIA") as any;
    const importe = Number(form.get("importe") || 0);
    const retIva = form.get("retIva") ? Number(form.get("retIva")) : undefined;
    const retGanancias = form.get("retGanancias") ? Number(form.get("retGanancias")) : undefined;
    const retIIBB = form.get("retIIBB") ? Number(form.get("retIIBB")) : undefined;
    const referencia = String(form.get("referencia") || "");
    const notas = String(form.get("notas") || "");

    if (!fechaPagoInput || !importe) {
      alert("Fecha de pago e importe son obligatorios.");
      return;
    }

    await registrarPago({
      facturaId: facturaId as any,
      fechaPago: new Date(fechaPagoInput).toISOString(),
      medio,
      importe,
      retIva,
      retGanancias,
      retIIBB,
      referencia: referencia || undefined,
      notas: notas || undefined,
    });

    // 👇 resetea con la referencia guardada
    formEl.reset();

    // 👇 recién ahora cerrá el modal
    setOpenPagar(null);
  };
  const onAnularClick = async (facturaId: string) => {
    const motivo = prompt("Motivo de anulación (opcional):") || undefined;
    await anular({ facturaId: facturaId as any, motivo });
    setOpenConfirmAnular(null);
  };

  // ---------- render ----------
  return (
    <div className="p-6 space-y-6">
      {/* Header + KPIs */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Facturas de Proveedor</h1>
        <div className="flex items-center gap-3">
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
          placeholder="Buscar Nº / notas..."
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
          <option value="PAGADA">PAGADA</option>
          <option value="ANULADA">ANULADA</option>
        </select>
        <input
          type="date"
          value={desde.split("T")[0] || ""}
          onChange={(e) => setDesde(e.target.value ? new Date(e.target.value).toISOString() : "")}
          className="bg-neutral-900 text-sm px-3 py-2 rounded border border-neutral-700 text-neutral-100"
        />
        <input
          type="date"
          value={hasta.split("T")[0] || ""}
          onChange={(e) => setHasta(e.target.value ? new Date(e.target.value).toISOString() : "")}
          className="bg-neutral-900 text-sm px-3 py-2 rounded border border-neutral-700 text-neutral-100"
        />
      </div>

      {/* Tabla */}
      <div className="rounded-md border border-neutral-800 overflow-hidden text-zinc-400">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-zinc-300">
            <tr>
              <th className="text-left px-4 py-2">Nº Prov.</th>
              <th className="text-left px-4 py-2">Proveedor</th>
              <th className="text-left px-4 py-2">Emisión</th>
              <th className="text-left px-4 py-2">Vence</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-right px-4 py-2">Total</th>
              <th className="text-right px-4 py-2">Saldo</th>
              <th className="text-right px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((f) => {
              const m = moneyFmt(f.moneda || "ARS");
              return (
                <tr key={f._id} className="border-t border-neutral-800">
                  <td className="px-4 py-2">{f.numeroProveedor}</td>
                  <td className="px-4 py-2">{f.proveedorNombre}</td>
                  <td className="px-4 py-2">
                    {new Date(f.fechaEmision).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-2">
                    {f.fechaVencimiento
                      ? new Date(f.fechaVencimiento).toLocaleDateString("es-AR")
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "px-2 py-1 rounded border",
                        f.estado === "PAGADA" && "bg-green-700/40 border-green-600 text-green-100",
                        f.estado === "PARCIAL" && "bg-yellow-700/40 border-yellow-600 text-yellow-100",
                        f.estado === "PENDIENTE" && "bg-neutral-800 border-neutral-600 text-neutral-200",
                        f.estado === "ANULADA" && "bg-red-800/40 border-red-600 text-red-100"
                      )}
                    >
                      {f.estado}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {m.format(f.total)} {f.moneda}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {m.format(f.saldo)} {f.moneda}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex gap-2 justify-end">
                      {f.estado !== "ANULADA" && f.estado !== "PAGADA" && (
                        <button
                          onClick={() => setOpenPagar(f._id)}
                          className="px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                        >
                          Pagar
                        </button>
                      )}
                      {f.estado !== "ANULADA" && f.estado !== "PAGADA" && (
                        <button
                                onClick={() => setOpenConfirmAnular(f._id)}
                                className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-500">
                                    Anular
                        </button>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {facturas.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-neutral-400">
                  No hay facturas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


{/* MODAL: Registrar pago */}
{openPagar && (
  <Modal onClose={() => setOpenPagar(null)} title="Registrar pago">
    <form onSubmit={onPagarSubmit(openPagar)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-zinc-500">
        {/* Fecha actual por defecto */}
        <L label="Fecha de pago">
          <input
            type="date"
            name="fechaPago"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="inp"
          />
        </L>

        {/* Medio de pago */}
        <L label="Medio de pago">
          <div className="relative">
            <select
              name="medio"
              id="medioPago"
              className="inp cursor-pointer appearance-none text-white bg-neutral-900 border border-neutral-600 pr-8"
              onChange={(e) => {
                const cuotasEl = document.getElementById("cuotasWrapper");
                const detalleEl = document.getElementById("detalleCuotas");
                if (cuotasEl) {
                  cuotasEl.style.display =
                    e.target.value === "TARJETA DE CREDITO" ? "block" : "none";
                }
                if (detalleEl) detalleEl.innerHTML = ""; // limpiar detalle
                // Reset importe
                const factura = facturas?.find((f) => f._id === openPagar);
                const input = document.getElementById("importeInput") as HTMLInputElement;
                if (factura && input) input.value = (factura.saldo ?? 0).toFixed(2);
              }}
              defaultValue=""
            >
              <option value="" disabled className="text-gray-400">
                Seleccione medio...
              </option>
              <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              <option value="EFECTIVO">EFECTIVO</option>
              <option value="CHEQUE">CHEQUE</option>
              <option value="TARJETA DE CREDITO">TARJETA DE CREDITO</option>
              <option value="TARJETA DE DEBITO">TARJETA DE DEBITO</option>
              <option value="OTRO">OTRO</option>
            </select>
          </div>
        </L>

        {/* Importe fijo */}
        <L label="Importe a pagar">
          <input
            type="number"
            step="0.01"
            name="importe"
            id="importeInput"
            value={(facturas?.find((f) => f._id === openPagar)?.saldo ?? 0).toFixed(2)}
            readOnly
            className="inp"
          />
        </L>
      </div>

      {/* Selector de cuotas (solo tarjeta de crédito) */}
      <div id="cuotasWrapper" style={{ display: "none" }}>
        <L label="Cuotas">
          <div className="relative">
            <select
              name="cuotas"
              id="cuotas"
              className="inp cursor-pointer appearance-none text-white bg-neutral-900 border border-neutral-600 pr-8"
              onChange={(e) => {
                const factura = facturas?.find((f) => f._id === openPagar);
                if (!factura) return;
                const input = document.getElementById("importeInput") as HTMLInputElement;
                const detalleEl = document.getElementById("detalleCuotas");
                if (!input || !detalleEl) return;

                const base = factura.saldo ?? 0;
                if (e.target.value) {
                  const interes = base * 0.1; // 10%
                  const totalConInteres = base + interes;
                  input.value = totalConInteres.toFixed(2);
                  const cuotas = parseInt(e.target.value);
                  const valorCuota = totalConInteres / cuotas;

                  detalleEl.innerHTML = `
                    <p>Total con interés: <b>$${totalConInteres.toFixed(2)}</b></p>
                    <p>${cuotas} cuotas de <b>$${valorCuota.toFixed(2)}</b></p>
                  `;
                } else {
                  input.value = base.toFixed(2);
                  detalleEl.innerHTML = "";
                }
              }}
              defaultValue=""
            >
              <option value="" disabled className="text-gray-400">
                Seleccione cuotas...
              </option>
              <option value="3">3 cuotas (10% interés)</option>
              <option value="5">5 cuotas (10% interés)</option>
              <option value="8">8 cuotas (10% interés)</option>
            </select>

          </div>
        </L>
        <div
          id="detalleCuotas"
          className="text-sm text-indigo-400 mt-2 space-y-1"
        ></div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpenPagar(null)}
          className="btn-ghost bg-indigo-600 rounded text-white p-2"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-success bg-indigo-600 rounded text-white p-2"
        >
          Guardar pago
        </button>
      </div>
    </form>
  </Modal>
)}

      {/* MODAL: Confirmar anulación */}
      {openConfirmAnular && (
        <Modal onClose={() => setOpenConfirmAnular(null)} title="Anular factura">
          <div className="space-y-4">
            <p className="text-white">
              ¿Seguro que querés <b>anular</b> esta factura? Esta acción pondrá el saldo en 0.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpenConfirmAnular(null)} className="btn-ghost bg-zinc-300 rounded w-20">Cancelar</button>
              <button onClick={() => onAnularClick(openConfirmAnular)} className="btn-danger bg-red-600 rounded w-20">Anular</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- mini helpers de UI ---------- */
function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-neutral-300">{label}</span>
      {children}
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-2xl mx-4 rounded-lg border border-neutral-700 bg-neutral-950 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200" aria-label="Cerrar">✕</button>
        </div>
        {/* estilos utilitarios */}
        <style jsx>{`
          .inp { background:#0a0a0a; border:1px solid #404040; color:#e5e5e5; border-radius:0.5rem; padding:0.5rem 0.75rem; }
          .btn-ghost { padding:0.5rem 0.75rem; border-radius:0.5rem; border:1px solid #404040; color:#e5e5e5; }
          .btn-primary { padding:0.5rem 0.75rem; border-radius:0.5rem; background:#4f46e5; color:white; }
          .btn-success { padding:0.5rem 0.75rem; border-radius:0.5rem; background:#059669; color:white; }
          .btn-danger { padding:0.5rem 0.75rem; border-radius:0.5rem; background:#dc2626; color:white; }
        `}</style>
        {children}
      </div>
    </div>
  );
}
