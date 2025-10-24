"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Id } from "@convex/_generated/dataModel";

export default function NuevaFacturaVentaPage() {
  const router = useRouter();

  // 🔹 Queries
  const clientes = useQuery(api.clientes_ventas.listar, {}) ?? [];
  const contratos = useQuery(api.contratos_servicios.listarConCliente) ?? [];
  const viajes = useQuery(api.viajes.listarConVehiculoYTarifa) ?? [];
  const ultimoNumero = useQuery(api.facturas_ventas.ultimoNumeroPorSucursal, {
    sucursal: "0212",
  });

  const crearFactura = useMutation(api.facturas_ventas.crear);

  // 🔹 Estado general
  const [clienteId, setClienteId] = useState<Id<"clientes_ventas"> | "">("");
  const [contratoId, setContratoId] = useState<Id<"contratos_servicios"> | "">("");
  const [tipoComprobante, setTipoComprobante] = useState<
    "FACTURA_A" | "FACTURA_B" | "FACTURA_C"
  >("FACTURA_B");
  const [numero, setNumero] = useState("021200000001");
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Fecha y hora actual
  const fecha = new Date().toISOString().slice(0, 10);
  const hora = new Date().toISOString().slice(11, 16);

  const COMISION_CHOFER_PORC = 0.1;

  // 🔹 Generar número correlativo
  useEffect(() => {
    if (!ultimoNumero) return;
    const suc = "0212";
    const siguiente = (Number(ultimoNumero.slice(4)) || 0) + 1;
    const numeroNuevo = suc + String(siguiente).padStart(8, "0");
    setNumero(numeroNuevo);
    setLoading(false);
  }, [ultimoNumero]);

  // 🔹 Filtrar viajes finalizados del cliente
  const viajesCliente = useMemo(
    () =>
      viajes.filter(
        (v: any) =>
          String(v.clienteId) === clienteId && v.estado === "FINALIZADO"
      ),
    [viajes, clienteId]
  );

  // 🔹 Agregar viaje como ítem facturable
  const addItem = (viaje: any) => {
    const precioBaseKm = viaje.tarifaPrecioKm ?? 0;

    if (precioBaseKm <= 0) {
      setError(
        `⚠️ No hay tarifa configurada para el tipo de vehículo (${viaje.tipoVehiculoNombre ?? "Sin tipo"}).`
      );
      return;
    }

    const base = viaje.distanciaKm * precioBaseKm;
    const comisionChofer = base * COMISION_CHOFER_PORC;
    const precioTotal = base + comisionChofer;

    const desc = `${viaje.origen} → ${viaje.destino} (${viaje.distanciaKm} km)`;

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
        distanciaKm: viaje.distanciaKm,
        tipoVehiculoNombre: viaje.tipoVehiculoNombre,
        precioKm: precioBaseKm,
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
      setError("Completa cliente, número y al menos un viaje.");
      return;
    }

    try {
      await crearFactura({
        clienteId: clienteId as Id<"clientes_ventas">,
        contratoId: contratoId
          ? (contratoId as Id<"contratos_servicios">)
          : undefined,
        numero,
        tipoComprobante,
        fecha,
        hora,
        items: items.map((i) => ({
          viajeId: i.viajeId,
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          subtotal: i.subtotal,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1b1e] text-[#e8f9f9]">
        <Loader2 className="animate-spin mr-2" /> Cargando numeración…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1b1e] text-[#e8f9f9] p-8 space-y-8">
      {/* HEADER */}
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

      {/* CABECERA */}
<div className="bg-[#11292e] border border-[#1e3c42] rounded-2xl p-8 space-y-8 shadow-xl w-[95%] max-w-[1500px] mx-auto">
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
              onChange={(e) =>
                setContratoId(e.target.value as Id<"contratos_servicios">)
              }
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

          {/* Tipo, sucursal y número */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm mb-1 block">Tipo</label>
              <select
                value={tipoComprobante}
                onChange={(e) =>
                  setTipoComprobante(
                    e.target.value as "FACTURA_A" | "FACTURA_B" | "FACTURA_C"
                  )
                }
                className="w-full rounded-lg border border-[#23454e] bg-[#0f2327] px-3 py-2 text-gray-200 focus:ring-2 focus:ring-[#36b6b0]"
              >
                <option value="FACTURA_A">Factura A</option>
                <option value="FACTURA_B">Factura B</option>
                <option value="FACTURA_C">Factura C</option>
              </select>
            </div>
            <div>
              <label className="text-sm mb-1 block">Sucursal</label>
              <input
                type="text"
                value="0212"
                readOnly
                className="w-full rounded-lg border border-[#23454e] bg-[#0f2327] px-3 py-2 text-center font-mono tracking-widest text-[#a8cfcf] opacity-80"
              />
            </div>
            <div>
              <label className="text-sm mb-1 block">Número *</label>
              <input
                type="text"
                value={numero.slice(4)}
                readOnly
                className="w-full rounded-lg border border-[#23454e] bg-[#0f2327] px-3 py-2 text-center font-mono tracking-widest text-[#e8f9f9]"
              />
            </div>
          </div>
        </div>

        {/* VIAJES */}
        {viajesCliente.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[#e8f9f9]">
              Viajes finalizados
            </h3>
            <div className="border border-[#1e3c42] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#0e2529] text-[#9ed1cd]">
                  <tr>
                    <th className="p-2 text-left">Descripción</th>
                    <th className="p-2 text-left">Vehículo</th>
                    <th className="p-2 text-left">Tipo</th>
                    <th className="p-2 text-right">Distancia</th>
                    <th className="p-2 text-right">Tarifa</th>
                    <th className="p-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {viajesCliente.map((v) => (
                    <tr
                      key={v._id}
                      className="border-t border-[#1e3c42] hover:bg-[#15393f] transition"
                    >
                      <td className="p-2">{v.origen} → {v.destino}</td>
                      <td className="p-2">{v.vehiculoNombre || "—"}</td>
                      <td className="p-2">{v.tipoVehiculoNombre || "—"}</td>
                      <td className="p-2 text-right">{v.distanciaKm} km</td>
                      <td className="p-2 text-right">
                        {v.tarifaPrecioKm
                          ? v.tarifaPrecioKm.toLocaleString("es-AR", {
                              style: "currency",
                              currency: "ARS",
                            })
                          : "—"}
                      </td>
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

        {/* ÍTEMS FACTURADOS */}
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
                      onClick={() =>
                        setItems(items.filter((_, ix) => ix !== idx))
                      }
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-4 text-gray-400 italic"
                  >
                    No hay ítems agregados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TOTALES */}
        <div className="bg-[#0f2327] rounded-xl border border-[#1e3c42] p-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>
              {subtotal.toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS",
              })}
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>IVA (21%):</span>
            <span>
              {iva.toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS",
              })}
            </span>
          </div>
          <div className="flex justify-between text-lg font-semibold text-white pt-1">
            <span>Total:</span>
            <span>
              {total.toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS",
              })}
            </span>
          </div>
        </div>

        {/* GUARDAR */}
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
