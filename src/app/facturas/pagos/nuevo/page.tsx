"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { useState, useMemo } from "react";

// 🔹 Tipos
type Medio = "TRANSFERENCIA" | "EFECTIVO" | "CHEQUE" | "TARJETA" | "OTRO";

type ComboComponent = {
  medio: Medio;
  porcentaje?: number;
  montoFijo?: number;
};

type Combo = {
  _id: string;
  nombre: string;
  componentes: ComboComponent[];
};

export default function NuevoPagoPage() {
  const router = useRouter();
  const proveedores = useQuery(api.proveedores.listar, { soloActivos: true }) ?? [];
  const comprobantes = useQuery(api.comprobantes_prov.listar, {}) ?? [];
  const combos = useQuery(api.combos_pago.listar) ?? []; // ✅ combos dinámicos desde Convex
  const registrarPagoMultiple = useMutation(api.comprobantes_prov.registrarPagoMultiple);

  const [proveedorId, setProveedorId] = useState<string>("");
  const [searchProveedor, setSearchProveedor] = useState<string>("");
  const [focusProveedor, setFocusProveedor] = useState(false);
  const [facturasSel, setFacturasSel] = useState<string[]>([]);
  const [pagos, setPagos] = useState<
    { medio: Medio; importe: number; notas?: string; referencia?: string }[]
  >([{ medio: "EFECTIVO", importe: 0 }]);

  // 🔎 lista de proveedores filtrados
  const proveedoresFiltrados = useMemo(() => {
    if (!searchProveedor.trim()) return proveedores;
    const q = searchProveedor.toLowerCase();
    return proveedores.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [searchProveedor, proveedores]);

  // 🔹 Facturas pendientes del proveedor
  const pendientes = useMemo(() => {
    return comprobantes.filter(
      (c: any) =>
        String(c.proveedorId) === proveedorId &&
        (c.estado === "PENDIENTE" || c.estado === "PARCIAL")
    );
  }, [proveedorId, comprobantes]);

  // 🔹 Total seleccionado
  const totalSeleccionado = useMemo(() => {
    return pendientes
      .filter((c: any) => facturasSel.includes(String(c._id)))
      .reduce((a, c) => a + (c.saldo ?? 0), 0);
  }, [facturasSel, pendientes]);

  // 🔹 Total de pagos cargados
  const totalPagos = useMemo(
    () => pagos.reduce((a, p) => a + (p.importe || 0), 0),
    [pagos]
  );

  // 🔹 Distribución de pagos simulada
  function calcularDistribucion(facturas: any[], totalDisponible: number) {
    const resultado: { factura: any; aplicado: number; saldoFinal: number }[] = [];
    for (const f of facturas) {
      if (totalDisponible <= 0) {
        resultado.push({ factura: f, aplicado: 0, saldoFinal: f.saldo });
        continue;
      }
      const aplicar = Math.min(totalDisponible, f.saldo);
      resultado.push({
        factura: f,
        aplicado: aplicar,
        saldoFinal: f.saldo - aplicar,
      });
      totalDisponible -= aplicar;
    }
    return resultado;
  }

  const distribucion = useMemo(() => {
    const seleccionadas = pendientes.filter((f: any) =>
      facturasSel.includes(String(f._id))
    );
    return calcularDistribucion(seleccionadas, totalPagos);
  }, [pendientes, facturasSel, totalPagos]);

  // 🔹 Confirmar pago
  async function confirmarPago() {
    if (!proveedorId || facturasSel.length === 0) {
      alert("Seleccioná proveedor y al menos una factura.");
      return;
    }

    if (totalPagos <= 0) {
      alert("Ingresá un importe válido en los métodos de pago.");
      return;
    }

    const diferencia = totalPagos - totalSeleccionado;
    if (diferencia > 1) {
      alert(
        `El total de los métodos de pago supera el total de facturas seleccionadas.\n\n` +
          `Total facturas: ${totalSeleccionado.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
          })}\n` +
          `Total métodos: ${totalPagos.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
          })}`
      );
      return;
    }

    for (const p of pagos) {
      if (p.medio === "TRANSFERENCIA" && !p.referencia) {
        alert("Falta número de referencia en una transferencia.");
        return;
      }
    }

    await registrarPagoMultiple({
      facturasIds: facturasSel as any,
      pagos,
    });

    router.push("/facturas/pagos");
  }

  // 🔹 Render principal
  return (
    <div className="min-h-screen bg-[#0b1618] p-6 space-y-8 text-gray-100">
      <h1 className="text-2xl font-bold text-white">Nuevo Pago</h1>

      {/* 🔍 Proveedor con búsqueda/autocomplete */}
      <div className="space-y-2 relative max-w-xl">
        <label className="text-sm text-gray-400">Proveedor</label>
        <input
          type="text"
          className="inp"
          placeholder="Buscar o seleccionar proveedor…"
          value={searchProveedor}
          onChange={(e) => {
            setSearchProveedor(e.target.value);
            setProveedorId("");
          }}
          onFocus={() => setFocusProveedor(true)}
          onBlur={() => setTimeout(() => setFocusProveedor(false), 200)}
        />
        {(focusProveedor || searchProveedor.length > 0) && (
          <div className="absolute z-10 bg-[#1a3035] border border-[#1e3c42] rounded-xl mt-1 w-full max-h-40 overflow-y-auto shadow-xl">
            {proveedoresFiltrados.map((p) => (
              <div
                key={p._id}
                onClick={() => {
                  setProveedorId(String(p._id));
                  setSearchProveedor(p.nombre);
                  setFacturasSel([]);
                  setFocusProveedor(false);
                }}
                className="px-3 py-2 hover:bg-[#1e3c42] cursor-pointer text-gray-200"
              >
                {p.nombre}
              </div>
            ))}
            {proveedoresFiltrados.length === 0 && (
              <div className="px-3 py-2 text-gray-500">No hay coincidencias</div>
            )}
          </div>
        )}
      </div>

      {/* 🧾 Facturas pendientes */}
      {proveedorId && (
        <div className="rounded-xl border border-[#1e3c42] overflow-hidden bg-[#11292e] shadow-lg max-w-4xl">
          <table className="w-full text-sm">
            <thead className="bg-[#1e3c42] text-gray-300">
              <tr>
                <th className="p-3 w-10"></th>
                <th className="p-3 text-left">Factura</th>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3c42]">
              {pendientes.map((f: any) => (
                <tr key={f._id} className="hover:bg-[#1a3035]">
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={facturasSel.includes(String(f._id))}
                      onChange={(e) =>
                        setFacturasSel((sel) =>
                          e.target.checked
                            ? [...sel, String(f._id)]
                            : sel.filter((id) => id !== String(f._id))
                        )
                      }
                    />
                  </td>
                  <td className="p-3 font-medium text-white">
                    {f.sucursal}-{f.numero}
                  </td>
                  <td className="p-3 text-gray-400">
                    {new Date(f.fecha).toLocaleDateString("es-AR")}
                  </td>
                  <td className="p-3 text-right font-medium text-gray-300">
                    {f.saldo.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })}
                  </td>
                </tr>
              ))}
              {pendientes.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    No hay facturas pendientes para este proveedor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 💳 Métodos de pago */}
      {facturasSel.length > 0 && (
        <div className="space-y-4 max-w-4xl">
          <h2 className="font-medium text-lg text-white">Métodos de pago</h2>

          {/* Selector de combo */}
          <div>
            <label className="text-sm text-gray-400">Combo de métodos</label>
            <select
              onChange={(e) => {
                const combo = combos.find((c) => c._id === e.target.value);
                if (combo) {
                  setPagos(
                    combo.componentes.map((c) => ({
                      medio: c.medio,
                      importe:
                        c.montoFijo ??
                        Math.round(
                          (totalSeleccionado * (c.porcentaje ?? 0)) / 100
                        ),
                    }))
                  );
                }
              }}
              className="inp w-64"
            >
              <option value="">Seleccionar combo</option>
              {combos.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Campos de métodos */}
          {pagos.map((pago, idx) => (
            <div key={idx} className="flex flex-wrap gap-3 items-center">
              <select
                className="inp w-40"
                value={pago.medio}
                onChange={(e) => {
                  const updated = [...pagos];
                  updated[idx].medio = e.target.value as Medio;
                  setPagos(updated);
                }}
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="CHEQUE">Cheque</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="OTRO">Otro</option>
              </select>
              <input
                type="number"
                className="inp w-32 text-right"
                value={pago.importe}
                onChange={(e) => {
                  const updated = [...pagos];
                  updated[idx].importe = parseFloat(e.target.value) || 0;
                  setPagos(updated);
                }}
              />
              {pago.medio === "TRANSFERENCIA" && (
                <input
                  type="text"
                  placeholder="N° de referencia"
                  className="inp w-56"
                  value={pago.referencia || ""}
                  onChange={(e) => {
                    const updated = [...pagos];
                    updated[idx].referencia = e.target.value;
                    setPagos(updated);
                  }}
                />
              )}
              <button
                onClick={() => setPagos(pagos.filter((_, i) => i !== idx))}
                className="text-red-500 hover:text-red-400 transition"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={() => setPagos([...pagos, { medio: "EFECTIVO", importe: 0 }])}
            className="px-3 py-1 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-medium transition"
          >
            + Agregar método
          </button>

          {/* Totales */}
          <div className="mt-6 p-4 bg-[#1a3035] border border-[#1e3c42] rounded-xl shadow-inner">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total seleccionado</span>
              <span className="text-emerald-400">
                {totalSeleccionado.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2 text-gray-400">
              <span>Total métodos</span>
              <span>
                {totalPagos.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 📊 Distribución */}
      {distribucion.length > 0 && (
        <div className="space-y-2 max-w-4xl">
          <h2 className="font-medium text-lg text-white">Distribución del pago</h2>
          <div className="rounded-xl border border-[#1e3c42] overflow-hidden bg-[#11292e] shadow-lg">
            <table className="w-full text-sm">
              <thead className="bg-[#1e3c42] text-gray-300">
                <tr>
                  <th className="p-3 text-left">Factura</th>
                  <th className="p-3 text-right">Saldo inicial</th>
                  <th className="p-3 text-right">Aplicado</th>
                  <th className="p-3 text-right">Saldo final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3c42]">
                {distribucion.map((d, i) => (
                  <tr key={i} className="hover:bg-[#1a3035]">
                    <td className="p-3 font-medium text-white">
                      {d.factura.sucursal}-{d.factura.numero}
                    </td>
                    <td className="p-3 text-right text-gray-400">
                      {d.factura.saldo.toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                      })}
                    </td>
                    <td className="p-3 text-right text-emerald-400 font-medium">
                      {d.aplicado.toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                      })}
                    </td>
                    <td
                      className="p-3 text-right font-medium"
                      style={{ color: d.saldoFinal > 0 ? "#fbbf24" : "#10b981" }}
                    >
                      {d.saldoFinal.toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🧭 Botonera */}
      {facturasSel.length > 0 && (
        <div className="flex gap-3 max-w-4xl pt-4">
          <button
            onClick={confirmarPago}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow-md"
          >
            Confirmar Pago
          </button>
          <button
            onClick={() => router.back()}
            className="px-5 py-2 rounded-lg bg-[#1e3c42] hover:bg-[#1a3035] text-white transition"
          >
            Cancelar
          </button>
        </div>
      )}

      <style jsx>{`
        .inp {
          background: #1a3035;
          border: 1px solid #1e3c42;
          color: #e6f6f7;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
