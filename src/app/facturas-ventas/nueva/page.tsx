"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState, useMemo } from "react";
import { ArrowLeft, Save, Info } from "lucide-react";
import Link from "next/link";
import type { Id } from "@convex/_generated/dataModel";

export default function NuevaFacturaVentaPage() {
  const router = useRouter();
  const clientes = useQuery(api.clientes_ventas.listar, {}) ?? [];
  const contratos = useQuery(api.contratos_servicios.listarConCliente) ?? [];
  const viajes = useQuery(api.viajes.listarConNombres) ?? [];
  const crearFactura = useMutation(api.facturas_ventas.crear);

  // Estado del formulario
  const [clienteId, setClienteId] = useState<Id<"clientes_ventas"> | "">("");
  const [contratoId, setContratoId] = useState<Id<"contratos_servicios"> | "">("");
  const [tipoComprobante, setTipoComprobante] = useState<
    "FACTURA_A" | "FACTURA_B" | "FACTURA_C"
  >("FACTURA_B");
  const [numero, setNumero] = useState("0212");
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  // 💰 Configuración de facturación
  const PRECIO_POR_KM = 5000;
  const COMISION_CHOFER_PORC = 0.1; // 10%

  // Fecha y hora actual
  const fecha = new Date().toISOString().slice(0, 10);
  const hora = new Date().toISOString().slice(11, 16);

  // 🔹 Filtrar viajes finalizados del cliente seleccionado
  const viajesCliente = useMemo(
    () =>
      viajes.filter(
        (v: any) => String(v.clienteId) === clienteId && v.estado === "FINALIZADO"
      ),
    [viajes, clienteId]
  );

  // 🔹 Agregar viaje como ítem facturable
  const addItem = (viaje: any) => {
    const desc = `${viaje.origen} → ${viaje.destino} (${viaje.distanciaKm} km)`;
    const base = viaje.distanciaKm * PRECIO_POR_KM;
    const comisionChofer = base * COMISION_CHOFER_PORC;
    const precioTotal = base + comisionChofer;

    if (items.some((i) => i.viajeId === viaje._id)) return;

    setItems((prev) => [
      ...prev,
      {
        viajeId: viaje._id,
        descripcion: desc,
        cantidad: 1,
        precioUnitario: precioTotal,
        subtotal: precioTotal,
        base,
        comisionChofer,
      },
    ]);
  };

  // 🔹 Calcular totales
  const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  // 🔹 Guardar factura
  async function handleGuardar() {
    if (!clienteId || numero.length !== 12 || items.length === 0) {
      setError("Completa cliente, número de factura (12 dígitos) y al menos un viaje.");
      return;
    }

    try {
      await crearFactura({
  clienteId: clienteId as Id<"clientes_ventas">,
  contratoId: contratoId ? (contratoId as Id<"contratos_servicios">) : undefined,
  numero,
  tipoComprobante,
  fecha,
  hora,
  items: items.map((i) => ({
    viajeId: i.viajeId,
    descripcion: i.descripcion,
    cantidad: i.cantidad,
    precioUnitario: i.precioUnitario,
    subtotal: i.subtotal, // ✅ ← agregado
  })),
  subtotal,
  iva,
  total,
  estado: "EMITIDA",
});

      router.push("/facturas-ventas");
    } catch (err: any) {
      setError(err.message || "Error al crear la factura.");
    }
  }

  // 🔹 Validar formato del número (prefijo 0212)
  const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (!val.startsWith("0212")) val = "0212" + val.replace(/^0212/, "");
    if (val.length > 12) val = val.slice(0, 12);
    setNumero(val);
  };

  return (
    <div className="min-h-screen bg-[#0d1b1e] text-[#e8f9f9] p-8 space-y-8">
      {/* ---------- HEADER ---------- */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nueva Factura de Cliente</h1>
        <Link
          href="/facturas-ventas"
          className="flex items-center gap-2 text-[#36b6b0] hover:text-[#2ca6a4]"
        >
          <ArrowLeft size={18} /> Volver
        </Link>
      </div>

      {error && (
        <div className="bg-red-800/30 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* ---------- CONFIGURACIÓN TARIFARIA ---------- */}
      <div className="bg-[#11292e] border border-[#1e3c42] rounded-xl p-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-[#36b6b0]" />
          <span className="text-gray-300">Precio por kilómetro:</span>
          <span className="text-[#36b6b0] font-semibold">
            {PRECIO_POR_KM.toLocaleString("es-AR", { style: "currency", currency: "ARS" })} / km
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Info size={16} className="text-[#36b6b0]" />
          <span className="text-gray-300">Comisión chofer:</span>
          <span className="text-[#36b6b0] font-semibold">{COMISION_CHOFER_PORC * 100}%</span>
        </div>
      </div>

      {/* ---------- FORMULARIO PRINCIPAL ---------- */}
      <div className="bg-[#11292e] border border-[#1e3c42] rounded-2xl p-6 space-y-6 shadow-lg max-w-5xl">
        {/* Datos de cabecera */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Cliente */}
          <div>
            <label className="text-sm mb-1 block">Cliente *</label>
            <select
              value={clienteId}
              onChange={(e) => {
                setClienteId(e.target.value as Id<"clientes_ventas">);
                setContratoId("");
                setItems([]);
              }}
              className="w-full rounded-lg border border-[#23454e] bg-[#0f2327] px-3 py-2 text-gray-200 focus:ring-2 focus:ring-[#36b6b0]"
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.alias ? `${c.alias} (${c.razonSocial})` : c.razonSocial}
                </option>
              ))}
            </select>
          </div>

          {/* Contrato */}
          <div>
            <label className="text-sm mb-1 block">Contrato (opcional)</label>
            <select
              value={contratoId}
              onChange={(e) => setContratoId(e.target.value as Id<"contratos_servicios">)}
              className="w-full rounded-lg border border-[#23454e] bg-[#0f2327] px-3 py-2 text-gray-200 focus:ring-2 focus:ring-[#36b6b0]"
            >
              <option value="">Sin contrato</option>
              {contratos
                .filter((c: any) => String(c.clienteId) === clienteId)
                .map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.tipo} —{" "}
                    {c.tarifaBase.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })}
                  </option>
                ))}
            </select>
          </div>

          {/* Tipo y número */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm mb-1 block">Tipo</label>
              <select
                value={tipoComprobante}
                onChange={(e) =>
                  setTipoComprobante(
                    e.target.value as "FACTURA_A" | "FACTURA_B" | "FACTURA_C"
                  )
                }
                className="w-full rounded-lg border border-[#23454e] bg-[#0f2327] px-3 py-2 text-gray-200"
              >
                <option value="FACTURA_A">Factura A</option>
                <option value="FACTURA_B">Factura B</option>
                <option value="FACTURA_C">Factura C</option>
              </select>
            </div>
            <div>
              <label className="text-sm mb-1 block">Número *</label>
              <input
                value={numero}
                onChange={handleNumeroChange}
                placeholder="0212########"
                className="w-full rounded-lg border border-[#23454e] bg-[#0f2327] px-3 py-2 text-gray-200"
                maxLength={12}
              />
            </div>
          </div>
        </div>

        {/* ---------- VIAJES DISPONIBLES ---------- */}
        {viajesCliente.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[#e8f9f9]">Viajes finalizados</h3>
            <div className="border border-[#1e3c42] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#0e2529] text-[#9ed1cd]">
                  <tr>
                    <th className="p-2 text-left">Descripción</th>
                    <th className="p-2 text-right">Distancia</th>
                    <th className="p-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {viajesCliente.map((v) => (
                    <tr
                      key={v._id}
                      className="border-t border-[#1e3c42] hover:bg-[#15393f] transition"
                    >
                      <td className="p-2">
                        {v.origen} → {v.destino}
                      </td>
                      <td className="p-2 text-right">{v.distanciaKm} km</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => addItem(v)}
                          className="px-3 py-1 text-xs rounded bg-[#36b6b0] hover:bg-[#2ca6a4] text-white"
                        >
                          + Agregar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">
            No hay viajes finalizados para este cliente.
          </p>
        )}

        {/* ---------- ÍTEMS FACTURADOS ---------- */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Ítems facturados</h3>
          <table className="w-full text-sm bg-[#0f2327] border border-[#1e3c42] rounded-xl overflow-hidden">
            <thead className="bg-[#1b3a3f] text-[#9ed1cd]">
              <tr>
                <th className="p-2 text-left">Descripción</th>
                <th className="p-2 text-right">Base</th>
                <th className="p-2 text-right">Chofer</th>
                <th className="p-2 text-right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i, idx) => (
                <tr key={idx} className="border-t border-[#1e3c42]">
                  <td className="p-2">{i.descripcion}</td>
                  <td className="p-2 text-right">
                    {i.base.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })}
                  </td>
                  <td className="p-2 text-right text-[#7bc3b7]">
                    {i.comisionChofer.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })}
                  </td>
                  <td className="p-2 text-right text-white font-semibold">
                    {i.subtotal.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => setItems(items.filter((_, ix) => ix !== idx))}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-400 italic">
                    No hay ítems agregados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ---------- TOTALES ---------- */}
        <div className="bg-[#0f2327] rounded-xl border border-[#1e3c42] p-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>
              {subtotal.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>IVA (21%):</span>
            <span>
              {iva.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
            </span>
          </div>
          <div className="flex justify-between text-lg font-semibold text-white pt-1">
            <span>Total:</span>
            <span>
              {total.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
            </span>
          </div>
        </div>

        {/* ---------- BOTÓN GUARDAR ---------- */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleGuardar}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-semibold"
          >
            <Save size={18} /> Guardar factura
          </button>
        </div>
      </div>
    </div>
  );
}
