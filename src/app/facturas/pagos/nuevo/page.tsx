"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id, Doc } from "../../../../../convex/_generated/dataModel";
import { useState, useMemo } from "react";

type Medio = "TRANSFERENCIA" | "EFECTIVO" | "CHEQUE" | "TARJETA" | "OTRO";

export default function NuevoPagoPage() {
  const router = useRouter();
  const proveedores = useQuery(api.proveedores.listar, { soloActivos: true }) ?? [];
  const comprobantes = useQuery(api.comprobantes_prov.listar, {}) ?? [];
  const registrarPagoMultiple = useMutation(api.comprobantes_prov.registrarPagoMultiple);

  const [proveedorId, setProveedorId] = useState<string>("");
  const [facturasSel, setFacturasSel] = useState<string[]>([]);
  const [pagos, setPagos] = useState<{ medio: Medio; importe: number; notas?: string }[]>([
    { medio: "EFECTIVO", importe: 0 },
  ]);

  // facturas pendientes del proveedor
  const pendientes = useMemo(() => {
    return comprobantes.filter(
      (c: any) =>
        String(c.proveedorId) === proveedorId &&
        (c.estado === "PENDIENTE" || c.estado === "PARCIAL")
    );
  }, [proveedorId, comprobantes]);

  const totalSeleccionado = useMemo(() => {
    return pendientes
      .filter((c: any) => facturasSel.includes(String(c._id)))
      .reduce((a, c) => a + (c.saldo ?? 0), 0);
  }, [facturasSel, pendientes]);

  const totalPagos = useMemo(
    () => pagos.reduce((a, p) => a + (p.importe || 0), 0),
    [pagos]
  );

  async function confirmarPago() {
    if (!proveedorId || facturasSel.length === 0) {
      return alert("Seleccioná proveedor y facturas.");
    }
    if (totalPagos !== totalSeleccionado) {
      return alert("El total de los métodos de pago no coincide con el total de facturas.");
    }

    await registrarPagoMultiple({
      facturasIds: facturasSel as any,
      pagos,
    });

    router.push("/facturas");
  }

  return (
    <div className="p-6 space-y-8 text-white">
      <h1 className="text-2xl font-bold">Nuevo Pago</h1>

      {/* Proveedor */}
      <div className="space-y-2">
        <label className="text-sm text-neutral-400">Proveedor</label>
        <select
          className="inp"
          value={proveedorId}
          onChange={(e) => {
            setProveedorId(e.target.value);
            setFacturasSel([]);
          }}
        >
          <option value="">Seleccione proveedor…</option>
          {proveedores.map((p: Doc<"proveedores">) => (
            <option key={p._id} value={String(p._id)}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Facturas pendientes */}
      {proveedorId && (
        <div className="rounded border border-neutral-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-300">
              <tr>
                <th className="p-2 w-10"></th>
                <th className="p-2 text-left">Factura</th>
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {pendientes.map((f: any) => (
                <tr key={f._id} className="border-t border-neutral-800">
                  <td className="p-2 text-center">
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
                  <td className="p-2">{f.sucursal}-{f.numero}</td>
                  <td className="p-2">
                    {new Date(f.fecha).toLocaleDateString("es-AR")}
                  </td>
                  <td className="p-2 text-right">
                    {f.saldo.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })}
                  </td>
                </tr>
              ))}
              {pendientes.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-neutral-500">
                    No hay facturas pendientes para este proveedor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Métodos de pago */}
      {facturasSel.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-medium text-lg">Métodos de pago</h2>
          {pagos.map((pago, idx) => (
            <div key={idx} className="flex gap-3 items-center">
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
                className="inp w-40 text-right"
                value={pago.importe}
                onChange={(e) => {
                  const updated = [...pagos];
                  updated[idx].importe = parseFloat(e.target.value) || 0;
                  setPagos(updated);
                }}
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
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white"
          >
            + Agregar método
          </button>

          {/* Totales */}
          <div className="mt-6 p-4 bg-neutral-900 border border-neutral-700 rounded-lg">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total seleccionado</span>
              <span className="text-emerald-400">
                {totalSeleccionado.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2 text-neutral-400">
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

      {/* Botonera */}
      {facturasSel.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={confirmarPago}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-medium"
          >
            Confirmar Pago
          </button>
          <button
            onClick={() => router.back()}
            className="px-5 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-white"
          >
            Cancelar
          </button>
        </div>
      )}

      <style jsx>{`
        .inp {
          background: #0a0a0a;
          border: 1px solid #404040;
          color: #e5e5e5;
          border-radius: 0.5rem;
          padding: 0.4rem 0.6rem;
        }
      `}</style>
    </div>
  );
}
