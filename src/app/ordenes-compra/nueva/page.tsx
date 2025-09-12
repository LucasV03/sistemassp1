'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

type ItemRow = {
  repuestoId?: Id<"repuestos"> | "";
  descripcion: string;
  cantidad: number;
  precio: number;
  iva: number; // %
};

export default function NuevaOC() {
  const router = useRouter();
  const crear = useMutation(api.ordenesCompra.crear);

  // Datos para selects
  const proveedores = useQuery(api.proveedores.listar, { ordenarPor: "nombre", orden: "asc" }) ?? [];
  const depositos   = useQuery(api.depositos.listar, {}) ?? [];
  const repuestos   = useQuery(api.repuestos.listar, {}) ?? [];

  // Header
  const [h, setH] = useState({
    proveedorId: "" as any,
    fechaOrden: new Date().toISOString(),
    fechaEsperada: "",
    depositoEntregaId: "" as any,
    moneda: "ARS" as "ARS" | "USD",
    tipoCambio: 1,
    condicionesPago: "",
    compradorUsuario: "",
    notas: "",
  });

  // >>> Ajuste automático del tipo de cambio según moneda
  useEffect(() => {
    if (h.moneda === "ARS") {
      setH(s => ({ ...s, tipoCambio: 1 }));
    } else if (h.moneda === "USD") {
      setH(s => ({ ...s, tipoCambio: 1400 }));
    }
  }, [h.moneda]);

  // Items
  const [items, setItems] = useState<ItemRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Quick add de fila
  const addRow = () =>
    setItems(a => [...a, { repuestoId: "", descripcion: "", cantidad: 1, precio: 0, iva: 21 }]);

  const removeRow = (i: number) =>
    setItems(a => a.filter((_, ix) => ix !== i));

  const updateRow = (i: number, patch: Partial<ItemRow>) =>
    setItems(a => a.map((row, ix) => (ix === i ? { ...row, ...patch } : row)));

  // Totales preview
  const preview = useMemo(() => {
    const subtotal = items.reduce((acc, it) => acc + (it.cantidad || 0) * (it.precio || 0), 0);
    const totalIva = items.reduce((acc, it) => {
      const base = (it.cantidad || 0) * (it.precio || 0);
      return acc + base * ((it.iva || 0) / 100);
    }, 0);
    return {
      subtotal,
      totalIva,
      totalGeneral: subtotal + totalIva,
    };
  }, [items]);

  async function submit() {
    setErr(null);
    if (!h.proveedorId) return setErr("Seleccioná un proveedor.");
    if (!h.depositoEntregaId) return setErr("Seleccioná el depósito de entrega.");
    if (items.length === 0) return setErr("Agregá al menos un ítem.");

    // Mapeo para backend en español
    try {
      setSaving(true);
      await crear({
        proveedorId: h.proveedorId as any,
        fechaOrden: h.fechaOrden,
        fechaEsperada: h.fechaEsperada || undefined,
        depositoEntregaId: h.depositoEntregaId as any,
        moneda: h.moneda,
        tipoCambio: Number(h.tipoCambio) || 1,
        condicionesPago: h.condicionesPago || undefined,
        compradorUsuario: h.compradorUsuario || "",
        notas: h.notas || undefined,
        items: items.map((it) => ({
          repuestoId: it.repuestoId as any,
          descripcion: it.descripcion || (repuestos.find(r => String(r._id) === String(it.repuestoId))?.nombre ?? ""),
          unidadMedida: "un",
          cantidadPedida: Number(it.cantidad) || 0,
          precioUnitario: Number(it.precio) || 0,
          descuentoPorc: 0,
          tasaImpuesto: Number(it.iva) || 0,
          depositoId: h.depositoEntregaId as any,
        })),
      });

      // 👉 redirigimos a la lista, como pediste
      router.push("/ordenes-compra");
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo guardar la OC");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6 text-white">
      <h1 className="text-2xl font-semibold">Nueva orden de compra</h1>

      {err && <div className="rounded border border-red-600 bg-red-900/30 text-red-200 px-3 py-2">{err}</div>}

      {/* Encabezado */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Proveedor */}
        <div>
          <label className="block text-sm text-neutral-300 mb-1">Proveedor</label>
          <select
            className="w-full bg-neutral-900 border border-neutral-800 rounded p-2"
            value={h.proveedorId ?? ""}
            onChange={(e) => setH(s => ({ ...s, proveedorId: e.target.value as any }))}
          >
            <option value="">Seleccionar un proveedor</option>
            {proveedores.map((p: any) => (
              <option key={p._id} value={p._id}>{p.nombre} {p.cuit ? `— CUIT ${p.cuit}` : ""}</option>
            ))}
          </select>
        </div>

        {/* Depósito destino */}
        <div>
          <label className="block text-sm text-neutral-300 mb-1">Depósito de entrega</label>
          <select
            className="w-full bg-neutral-900 border border-neutral-800 rounded p-2"
            value={h.depositoEntregaId ?? ""}
            onChange={(e) => setH(s => ({ ...s, depositoEntregaId: e.target.value as any }))}
          >
            <option value="">Seleccionar depósito</option>
            {depositos.map((d: any) => (
              <option key={d._id} value={d._id}>{d.nombre}</option>
            ))}
          </select>
        </div>

        {/* Dirección de entrega */}


        {/* Fecha orden (solo lectura) */}
        <div>
          <label className="block text-sm text-neutral-300 mb-1">Fecha de orden</label>
          <input
            className="w-full bg-neutral-900 border border-neutral-800 rounded p-2"
            value={new Date(h.fechaOrden).toLocaleString()}
            readOnly
          />
        </div>

        {/* Fecha esperada */}
        <div>
          <label className="block text-sm text-neutral-300 mb-1">Fecha esperada</label>
          <input
            type="date"
            className="w-full bg-neutral-900 border border-neutral-800 rounded p-2"
            placeholder="Fecha prevista de entrega"
            onChange={(e) => {
              const d = e.target.value ? new Date(e.target.value) : null;
              setH(s => ({ ...s, fechaEsperada: d ? d.toISOString() : "" }));
            }}
          />
        </div>

        {/* Moneda / Tipo de cambio */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Moneda</label>
            <select
              className="w-full bg-neutral-900 border border-neutral-800 rounded p-2"
              value={h.moneda}
              onChange={(e) => setH(s => ({ ...s, moneda: e.target.value as any }))}
            >
              <option value="ARS">ARS (peso argentino)</option>
              <option value="USD">USD (dólar)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Tipo de cambio</label>
            {h.moneda === "ARS" ? (
              // ARS: deshabilitado y muestra guion
              <input
                type="text"
                className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-center text-neutral-400"
                value="-"
                disabled
                title="No aplica tipo de cambio para ARS"
              />
            ) : (
              // USD: editable con 1400 por defecto
              <input
                type="number"
                step="0.0001"
                className="w-full bg-neutral-900 border border-neutral-800 rounded p-2"
                placeholder="Ej: 1400.00"
                value={h.tipoCambio}
                onChange={(e) => setH(s => ({ ...s, tipoCambio: Number(e.target.value) || 1 }))}
              />
            )}
          </div>
        </div>

        {/* Condiciones / Comprador */}
        <div>
          <label className="block text-sm text-neutral-300 mb-1">Condiciones de pago</label>
          <input
            className="w-full bg-neutral-900 border border-neutral-800 rounded p-2"
            placeholder="Ej: 30 días FF / Contado / Transferencia"
            value={h.condicionesPago}
            onChange={(e) => setH(s => ({ ...s, condicionesPago: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-300 mb-1">Comprador</label>
          <input
            className="w-full bg-neutral-900 border border-neutral-800 rounded p-2"
            placeholder="Nombre del comprador"
            value={h.compradorUsuario}
            onChange={(e) => setH(s => ({ ...s, compradorUsuario: e.target.value }))}
          />
        </div>

        <div className="lg:col-span-3">
          <label className="block text-sm text-neutral-300 mb-1">Notas</label>
          <textarea
            rows={3}
            className="w-full bg-neutral-900 border border-neutral-800 rounded p-2"
            placeholder="Observaciones / instrucciones de entrega…"
            value={h.notas}
            onChange={(e) => setH(s => ({ ...s, notas: e.target.value }))}
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Ítems</h2>
          <button
            className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
            onClick={addRow}
          >
            Agregar ítem
          </button>
        </div>

        <div className="rounded border border-neutral-800 overflow-hidden bg-[#0c0c0c]">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-100">
              <tr>
                <th className="p-2 text-left">Repuesto</th>
                <th className="p-2 text-left">Descripción</th>
                <th className="p-2 text-right">Cant.</th>
                <th className="p-2 text-right">P.Unit</th>
                <th className="p-2 text-right">IVA%</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody className="text-neutral-200">
              {items.map((it, i) => (
                <tr key={i} className="border-t border-neutral-800">
                  <td className="p-2">
                    {/* Selector con búsqueda simple */}
                    <select
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-1"
                      value={String(it.repuestoId ?? "")}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        updateRow(i, { repuestoId: val });
                        const r = repuestos.find(r => String(r._id) === String(val));
                        if (r && !it.descripcion) {
                          updateRow(i, { descripcion: r.nombre, precio: r.precioUnitario ?? 0 });
                        }
                      }}
                    >
                      <option value="">Elegí un repuesto…</option>
                      {repuestos.map((r: any) => (
                        <option key={r._id} value={r._id}>
                          {r.codigo ? `${r.codigo} — ` : ""}{r.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-1"
                      placeholder="Descripción visible en la OC"
                      value={it.descripcion}
                      onChange={(e) => updateRow(i, { descripcion: e.target.value })}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      className="w-24 bg-neutral-900 border border-neutral-800 rounded p-1 text-right"
                      placeholder="0"
                      value={it.cantidad}
                      onChange={(e) => updateRow(i, { cantidad: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      className="w-28 bg-neutral-900 border border-neutral-800 rounded p-1 text-right"
                      placeholder="0.00"
                      value={it.precio}
                      onChange={(e) => updateRow(i, { precio: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      className="w-20 bg-neutral-900 border border-neutral-800 rounded p-1 text-right"
                      placeholder="21"
                      value={it.iva}
                      onChange={(e) => updateRow(i, { iva: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <button
                      className="px-2 py-1 bg-red-600/80 hover:bg-red-600 rounded text-white"
                      onClick={() => removeRow(i)}
                    >
                      Del
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-neutral-400">
                    Agregá al menos un ítem.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="flex justify-end text-sm text-neutral-200">
          <div className="w-full sm:w-80">
            <div className="flex justify-between py-1">
              <span>Subtotal</span>
              <span>{preview.subtotal.toFixed(2)} {h.moneda}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Impuesto</span>
              <span>{preview.totalIva.toFixed(2)} {h.moneda}</span>
            </div>
            <div className="flex justify-between border-t border-neutral-800 mt-1 pt-2 font-semibold">
              <span>Total</span>
              <span>{preview.totalGeneral.toFixed(2)} {h.moneda}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botonera */}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={saving}
          className="px-4 py-2 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white"
        >
          {saving ? 'Guardando…' : 'Guardar Orden de Compra'}
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
