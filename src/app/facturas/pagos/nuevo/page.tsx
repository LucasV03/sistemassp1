"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { useState, useMemo } from "react";

type Medio = "TRANSFERENCIA" | "EFECTIVO" | "CHEQUE" | "TARJETA" | "OTRO";

export default function NuevoPagoPage() {
  const router = useRouter();
  const proveedores = useQuery(api.proveedores.listar, { soloActivos: true }) ?? [];
  const comprobantes = useQuery(api.comprobantes_prov.listar, {}) ?? [];
  const registrarPagoMultiple = useMutation(api.comprobantes_prov.registrarPagoMultiple);

  const [proveedorId, setProveedorId] = useState<string>("");
  const [searchProveedor, setSearchProveedor] = useState<string>("");
  const [focusProveedor, setFocusProveedor] = useState(false);
  const [facturasSel, setFacturasSel] = useState<string[]>([]);
  const [pagos, setPagos] = useState<{ medio: Medio; importe: number; notas?: string }[]>([
    { medio: "EFECTIVO", importe: 0 },
  ]);

  // 🔎 lista de proveedores filtrados
  const proveedoresFiltrados = useMemo(() => {
    if (!searchProveedor.trim()) return proveedores;
    const q = searchProveedor.toLowerCase();
    return proveedores.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [searchProveedor, proveedores]);

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

  // 🔎 Simulación de distribución de pagos parciales
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

  async function confirmarPago() {
    // Usamos mensajes en el console o modales custom en lugar de alert()
    if (!proveedorId || facturasSel.length === 0) {
      return console.error("Error: Seleccioná proveedor y facturas.");
    }

    if (totalPagos <= 0) {
      return console.error("Error: Ingresá un importe válido en los métodos de pago.");
    }

    if (totalPagos > totalSeleccionado) {
      return console.error(
        "Error: El total de los métodos de pago no puede superar el total de facturas seleccionadas."
      );
    }

    await registrarPagoMultiple({
      facturasIds: facturasSel as any,
      pagos,
    });

    router.push("/facturas/pagos");
  }

  return (
    // Fondo principal: Usamos el color oscuro `#0b1618`
    <div className="min-h-screen bg-[#0b1618] p-6 space-y-8 text-gray-100">
      <h1 className="text-2xl font-bold text-white">Nuevo Pago</h1>

      {/* Proveedor con búsqueda/autocomplete */}
      <div className="space-y-2 relative max-w-xl">
        <label className="text-sm text-gray-400">Proveedor</label>
        <input
          type="text"
          className="inp" // Clase .inp definida en <style jsx>
          placeholder="Buscar o seleccionar proveedor…"
          value={searchProveedor}
          onChange={(e) => {
            setSearchProveedor(e.target.value);
            setProveedorId("");
          }}
          onFocus={() => setFocusProveedor(true)}
          onBlur={() => setTimeout(() => setFocusProveedor(false), 200)} // delay para permitir click
        />

        {(focusProveedor || searchProveedor.length > 0) && (
          // Contenedor de autocompletado
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

      {/* Facturas pendientes */}
      {proveedorId && (
        // Contenedor de la tabla: Usamos el color de caja/fondo secundario: `#11292e`
        <div className="rounded-xl border border-[#1e3c42] overflow-hidden bg-[#11292e] shadow-lg max-w-4xl">
          <table className="w-full text-sm">
            {/* Encabezado de la tabla */}
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

      {/* Métodos de pago */}
      {facturasSel.length > 0 && (
        <div className="space-y-4 max-w-4xl">
          <h2 className="font-medium text-lg text-white">Métodos de pago</h2>
          {pagos.map((pago, idx) => (
            <div key={idx} className="flex gap-3 items-center">
              <select
                className="inp w-40" // Clase .inp definida en <style jsx>
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
                className="inp w-40 text-right" // Clase .inp definida en <style jsx>
                value={pago.importe}
                onChange={(e) => {
                  const updated = [...pagos];
                  updated[idx].importe = parseFloat(e.target.value) || 0;
                  setPagos(updated);
                }}
              />
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
            // Botón Agregar método (teal/acento)
            className="px-3 py-1 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-medium transition"
          >
            + Agregar método
          </button>

          {/* Totales */}
          {/* Contenedor de totales */}
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

      {/* Distribución del pago */}
      {distribucion.length > 0 && (
        <div className="space-y-2 max-w-4xl">
          <h2 className="font-medium text-lg text-white">Distribución del pago</h2>
          {/* Contenedor de la tabla: Usamos el color de caja/fondo secundario: `#11292e` */}
          <div className="rounded-xl border border-[#1e3c42] overflow-hidden bg-[#11292e] shadow-lg">
            <table className="w-full text-sm">
              {/* Encabezado de la tabla */}
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
                    <td className="p-3 text-right font-medium"
                      style={{ color: d.saldoFinal > 0 ? '#fbbf24' : '#10b981' }} // Amarillo para saldo > 0, Verde si es 0
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

      {/* Botonera */}
      {facturasSel.length > 0 && (
        <div className="flex gap-3 max-w-4xl pt-4">
          <button
            onClick={confirmarPago}
            // Botón Confirmar Pago (Verde/Éxito)
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow-md"
          >
            Confirmar Pago
          </button>
          <button
            onClick={() => router.back()}
            // Botón Cancelar (Secundario/Gris oscuro)
            className="px-5 py-2 rounded-lg bg-[#1e3c42] hover:bg-[#1a3035] text-white transition"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Ajuste de la clase .inp para la nueva estética oscura */}
      <style jsx>{`
        .inp {
          background: #1a3035; /* Fondo de inputs más oscuro que la caja principal */
          border: 1px solid #1e3c42; /* Borde más sutil */
          color: #e6f6f7; /* Texto blanco/gris claro */
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem; /* Ajuste padding */
          width: 100%; /* Aseguramos que ocupe todo el ancho disponible */
        }
      `}</style>
    </div>
  );
}