// src/app/facturas/nueva/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id, Doc } from "../../../../convex/_generated/dataModel";

type ItemRow = {
  repuestoId?: Id<"repuestos"> | "";
  descripcion: string;
  cantidad: number;
  precio: number;
};

export default function NuevaFacturaPage() {
  const router = useRouter();

  // queries
  const proveedores = useQuery(api.proveedores.listar, { soloActivos: true }) ?? [];
  const tiposComprobantes = useQuery(api.tipos_comprobante.listar, {}) ?? [];
  const repuestos = useQuery(api.repuestos.listar, {}) ?? [];

  // mutation
  const crearComprobante = useMutation(api.comprobantes_prov.crear);

  // estado encabezado
  const [proveedorId, setProveedorId] = useState<string>("");
  const [cuit, setCuit] = useState("");

  const [tipoComprobanteId, setTipoComprobanteId] = useState<string>("");
  const [tipoFactura, setTipoFactura] = useState("A");
  const [sucursal, setSucursal] = useState("");
  const [numero, setNumero] = useState("00000001");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10)); // yyyy-mm-dd
  const [hora, setHora] = useState(new Date().toISOString().slice(11, 16)); // hh:mm


  // items
  const [items, setItems] = useState<ItemRow[]>([]);
  const addRow = () =>
    setItems((a) => [...a, { repuestoId: "", descripcion: "", cantidad: 1, precio: 0 }]);
  const removeRow = (i: number) => setItems((a) => a.filter((_, ix) => ix !== i));
  const updateRow = (i: number, patch: Partial<ItemRow>) =>
    setItems((a) => a.map((row, ix) => (ix === i ? { ...row, ...patch } : row)));

  // totales preview
  const preview = useMemo(() => {
    const subtotal = items.reduce((acc, it) => acc + (it.cantidad || 0) * (it.precio || 0), 0);
    return { subtotal };
  }, [items]);

  // auto-set sucursal cuando cambia proveedor
  useEffect(() => {
    if (proveedorId) {
      const p = proveedores.find((x) => String(x._id) === proveedorId);
      if (p?.codigo) setSucursal(p.codigo.padStart(4, "0"));
      if (p?.cuit) setCuit(p.cuit);
    }else{
        setSucursal("");
      setCuit("");
    }
  }, [proveedorId, proveedores]);
  

  // estado de guardado
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    if (!proveedorId || !tipoComprobanteId || !tipoFactura || !sucursal || !numero || !fecha || !hora) {
      return setErr("Todos los campos son obligatorios.");
    }
    if (items.length === 0) return setErr("Agregá al menos un ítem.");

    try {
      setSaving(true);
      await crearComprobante({
  proveedorId: proveedorId as any,
  proveedorCuit: cuit,  
  tipoComprobanteId: tipoComprobanteId as any,
  letra: tipoFactura,
  sucursal,
  numero,
  fecha,
  hora,
  items: items.map((it) => ({
    repuestoId: it.repuestoId as any,
    cantidad: it.cantidad,
    precioUnitario: it.precio,
  })),
});

      router.push("/facturas");
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo guardar el comprobante");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6 text-white">
      <h1 className="text-2xl font-bold">Nuevo Comprobante</h1>

      {err && (
        <div className="rounded border border-red-600 bg-red-900/30 text-red-200 px-3 py-2">
          {err}
        </div>
      )}

      {/* Encabezado */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Proveedor */}
        <LabelField label="Proveedor">
          <select
            className="inp"
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
          >
            <option value="">Seleccione proveedor…</option>
            {proveedores.map((p: Doc<"proveedores">) => (
              <option key={p._id} value={String(p._id)}>
                {p.nombre}
              </option>
            ))}
          </select>
        </LabelField>
<LabelField label="CUIT">
          <input
            className="inp"
            value={cuit}
            readOnly
            placeholder="CUIT"
          />
        </LabelField>


        {/* Tipo de comprobante */}
        <LabelField label="Tipo de comprobante">
          <select
            className="inp"
            value={tipoComprobanteId}
            onChange={(e) => setTipoComprobanteId(e.target.value)}
          >
            <option value="">Seleccione tipo…</option>
            {tiposComprobantes.map((t: Doc<"tipos_comprobante">) => (
              <option key={t._id} value={String(t._id)}>
                {t.nombre}
              </option>
            ))}
          </select>
        </LabelField>

        {/* Tipo factura (A/B/C) */}
        <LabelField label="Tipo de factura">
          <select className="inp" value={tipoFactura} onChange={(e) => setTipoFactura(e.target.value)}>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </LabelField>

        {/* Sucursal */}
        <LabelField label="Sucursal">
          <input
            className="inp"
            value={sucursal}
            onChange={(e) => setSucursal(e.target.value)}
            placeholder="0001"
          />
        </LabelField>

        {/* Número */}
        <LabelField label="Número">
          <input
            className="inp"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="00000001"
          />
        </LabelField>


        {/* Fecha y hora */}
        <LabelField label="Fecha">
  <input
    type="date"
    className="inp"
    value={fecha}
    onChange={(e) => setFecha(e.target.value)}
    required
  />
</LabelField>

<LabelField label="Hora">
  <input
    type="time"
    className="inp"
    value={hora}
    onChange={(e) => setHora(e.target.value)}
    required
  />
</LabelField>

</div>

      {/* Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Ítems</h2>
          <button
            type="button"
            className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
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
                <th className="p-2 text-right">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-t border-neutral-800">
                  <td className="p-2">
                    <select
                      className="inp"
                      value={String(it.repuestoId ?? "")}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        updateRow(i, { repuestoId: val });
                        const r = repuestos.find((r) => String(r._id) === val);
                        if (r) updateRow(i, { descripcion: r.nombre, precio: r.precioUnitario ?? 0 });
                      }}
                    >
                      <option value="">Seleccione repuesto…</option>
                      {repuestos.map((r: any) => (
                        <option key={r._id} value={String(r._id)}>
                          {r.codigo ? `${r.codigo} — ` : ""}
                          {r.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      className="inp"
                      value={it.descripcion}
                      onChange={(e) => updateRow(i, { descripcion: e.target.value })}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      className="inp text-right"
                      value={it.cantidad}
                      onChange={(e) => updateRow(i, { cantidad: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      className="inp text-right"
                      value={it.precio}
                      onChange={(e) => updateRow(i, { precio: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="p-2 text-right">
                    {(it.cantidad * it.precio).toFixed(2)}
                  </td>
                  <td className="p-2 text-right">
                    <button
                      type="button"
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
            <div className="flex justify-between border-t border-neutral-800 mt-1 pt-2 font-semibold">
              <span>Total</span>
              <span>{preview.subtotal.toFixed(2)} ARS</span>
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
          {saving ? "Guardando…" : "Guardar Comprobante"}
        </button>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
        >
          Cancelar
        </button>
      </div>

      <style jsx>{`
        .inp {
          background: #0a0a0a;
          border: 1px solid #404040;
          color: #e5e5e5;
          border-radius: 0.5rem;
          padding: 0.4rem 0.6rem;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
/* ---------- helper ---------- */
function LabelField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-neutral-300">{label}</span>
      {children}
    </label>
  );
}
