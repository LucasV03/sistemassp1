'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

type Moneda = 'ARS' | 'USD';

type DraftItem = {
  repuestoId: string;
  descripcion: string;
  cantidadPedida: number;
  precioUnitario: number;
  descuentoPorc?: number;
  tasaImpuesto?: number;
  fechaNecesidad?: string;
  centroCosto?: string;
};

export default function NuevaOC() {
  const router = useRouter();

  // Datos base
  const proveedores = useQuery(api.proveedores.listar, {
    buscar: '',
    soloActivos: false,
    ordenarPor: 'nombre',
    orden: 'asc',
  }) ?? [];

  const depositos = useQuery(api.depositos.listar, {}) ?? [];
  const repuestos = useQuery(api.repuestos.listar, {}) ?? [];

  // Mutations
  const crear = useMutation(api.ordenesCompra.crear);

  // Header (no mostramos fechaOrden; la mandamos como "hoy" en el submit)
  const [header, setHeader] = useState({
    proveedorId: '',
    fechaEsperada: '', // YYYY-MM-DD (opcional)
    depositoEntregaId: '',
    direccionEntrega: '',
    moneda: 'ARS' as Moneda,
    tipoCambio: '' as string, // texto para el input; se convierte a number si hace falta
    condicionesPago: '',
    incoterm: '', // Ej: FOB, CIF (opcional)
    compradorUsuario: '',
    notas: '',
  });

  // Estado UI
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Ítems
  const [items, setItems] = useState<DraftItem[]>([]);

  // --- Buscador de repuestos para agregar ---
  const [qRep, setQRep] = useState('');
  const repuestosFiltrados = useMemo(() => {
    const q = qRep.trim().toLowerCase();
    if (!q) return repuestos.slice(0, 25);
    return repuestos
      .filter(r =>
        [
          r.codigo,
          r.nombre,
          r.categoria,
          r.vehiculo,
          r.descripcion ?? '',
          r.marca ?? '',
          r.modeloCompatible ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 25);
  }, [repuestos, qRep]);

  function addItemFromRepuesto(repId: string) {
    const rep = repuestos.find(r => String(r._id) === repId);
    if (!rep) return;

    const yaExiste = items.some(it => it.repuestoId === repId);
    if (yaExiste) {
      setErr('Ese repuesto ya fue agregado.');
      return;
    }

    setItems(prev => [
      ...prev,
      {
        repuestoId: String(rep._id),
        descripcion: rep.nombre ?? '',
        cantidadPedida: 1,
        precioUnitario: Number(rep.precioUnitario ?? 0),
        tasaImpuesto: 21,
      },
    ]);
    setErr(null);
    setQRep('');
  }

  function updateItem(i: number, patch: Partial<DraftItem>) {
    setItems(prev => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i));
  }

  // Validaciones y submit
  async function submit() {
    setErr(null);

    if (!header.proveedorId) return setErr('Seleccioná un proveedor.');
    if (!header.depositoEntregaId) return setErr('Seleccioná el depósito de destino.');
    if (items.length === 0) return setErr('Agregá al menos un ítem.');
    if (items.some(it => !it.repuestoId)) return setErr('Todos los ítems deben tener un repuesto.');
    if (items.some(it => Number(it.cantidadPedida) <= 0)) return setErr('Las cantidades deben ser > 0.');
    if (items.some(it => Number(it.precioUnitario) < 0)) return setErr('El precio unitario no puede ser negativo.');

    try {
      setSaving(true);

      const ocId = await crear({
        proveedorId: header.proveedorId as any,
        fechaOrden: new Date().toISOString(), // hoy (no se muestra)
        fechaEsperada: header.fechaEsperada ? new Date(header.fechaEsperada).toISOString() : undefined,

        depositoEntregaId: header.depositoEntregaId as any,
        direccionEntrega: header.direccionEntrega || undefined,

        moneda: header.moneda,
        tipoCambio:
          header.moneda === 'USD' && header.tipoCambio.trim() !== ''
            ? Number(header.tipoCambio)
            : undefined,

        condicionesPago: header.condicionesPago || undefined,
        incoterm: header.incoterm || undefined,

        compradorUsuario: header.compradorUsuario || '',
        notas: header.notas || undefined,

        items: items.map(it => ({
          repuestoId: it.repuestoId as any,
          descripcion: it.descripcion,
          // no pedimos UM; el schema requiere unidadMedida -> fijo "un"
          unidadMedida: 'un',
          cantidadPedida: Number(it.cantidadPedida),
          precioUnitario: Number(it.precioUnitario),
          descuentoPorc: Number(it.descuentoPorc ?? 0),
          tasaImpuesto: Number(it.tasaImpuesto ?? 21),
          // el detalle pide depositoId: usamos el depósito de entrega
          depositoId: header.depositoEntregaId as any,
          fechaNecesidad: it.fechaNecesidad || undefined,
          centroCosto: it.centroCosto || undefined,
        })),
      });

      router.push(`/ordenes-compra/${ocId}`);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? 'No se pudo guardar la orden de compra');
    } finally {
      setSaving(false);
    }
  }

  // Helpers UI
  const dinero = (n: number) =>
    new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="p-6 space-y-6 text-white">
      <h1 className="text-2xl font-semibold">Nueva Orden de compra</h1>

      {err && (
        <div className="rounded border border-red-600 bg-red-900/30 text-red-200 px-3 py-2">
          {err}
        </div>
      )}

      {/* Header */}
      <div className="grid md:grid-cols-3 gap-3">
        {/* Proveedor */}
        <select
          className="bg-neutral-900 text-white p-2 rounded border border-neutral-800"
          value={header.proveedorId}
          onChange={(e) => setHeader(h => ({ ...h, proveedorId: e.target.value }))}
        >
          <option value="">Seleccioná un proveedor…</option>
          {proveedores.map((p: any) => (
            <option key={String(p._id)} value={String(p._id)}>
              {p.nombre} {p.cuit ? `— CUIT ${p.cuit}` : ''}
            </option>
          ))}
        </select>

        {/* Depósito destino */}
        <select
          className="bg-neutral-900 text-white p-2 rounded border border-neutral-800"
          value={header.depositoEntregaId}
          onChange={(e) => setHeader(h => ({ ...h, depositoEntregaId: e.target.value }))}
        >
          <option value="">Depósito de destino…</option>
          {depositos.map((d: any) => (
            <option key={String(d._id)} value={String(d._id)}>{d.nombre}</option>
          ))}
        </select>

        {/* Comprador */}
        <input
          className="bg-neutral-900 text-white p-2 rounded border border-neutral-800"
          placeholder="Comprador (texto libre, ej: Lucas Vera)"
          value={header.compradorUsuario}
          onChange={(e) => setHeader(h => ({ ...h, compradorUsuario: e.target.value }))}
        />

        {/* Dirección de entrega */}
        <input
          className="bg-neutral-900 text-white p-2 rounded border border-neutral-800 md:col-span-2"
          placeholder="Dirección de entrega (opcional, ej: Av. Siempre Viva 742)"
          value={header.direccionEntrega}
          onChange={(e) => setHeader(h => ({ ...h, direccionEntrega: e.target.value }))}
        />

        {/* Fecha esperada (única fecha visible) */}
        <input
          type="date"
          className="bg-neutral-900 text-white p-2 rounded border border-neutral-800"
          placeholder="YYYY-MM-DD"
          value={header.fechaEsperada}
          onChange={(e) => setHeader(h => ({ ...h, fechaEsperada: e.target.value }))}
        />

        {/* Moneda */}
        <div className="flex gap-2 items-center">
          <label className="text-sm text-neutral-300">Moneda:</label>
          <select
            className="bg-neutral-900 text-white p-2 rounded border border-neutral-800"
            value={header.moneda}
            onChange={(e) => setHeader(h => ({ ...h, moneda: e.target.value as Moneda }))}
          >
            <option value="ARS">ARS (Pesos)</option>
            <option value="USD">USD (Dólares)</option>
          </select>
        </div>

        {/* Tipo de cambio (sólo si USD) */}
        {header.moneda === 'USD' && (
          <input
            className="bg-neutral-900 text-white p-2 rounded border border-neutral-800"
            placeholder="Tipo de cambio (Ej: 900.50)"
            inputMode="decimal"
            value={header.tipoCambio}
            onChange={(e) => setHeader(h => ({ ...h, tipoCambio: e.target.value }))}
          />
        )}

        {/* Condiciones de pago */}
        <input
          className="bg-neutral-900 text-white p-2 rounded border border-neutral-800"
          placeholder="Condiciones de pago (Ej: 30 días)"
          value={header.condicionesPago}
          onChange={(e) => setHeader(h => ({ ...h, condicionesPago: e.target.value }))}
        />

        {/* Incoterm */}
        <input
          className="bg-neutral-900 text-white p-2 rounded border border-neutral-800"
          placeholder="Incoterm (opcional, Ej: FOB, CIF)"
          value={header.incoterm}
          onChange={(e) => setHeader(h => ({ ...h, incoterm: e.target.value }))}
        />

        {/* Notas */}
        <textarea
          rows={3}
          className="bg-neutral-900 text-white p-2 rounded border border-neutral-800 md:col-span-3"
          placeholder="Notas (opcional)"
          value={header.notas}
          onChange={(e) => setHeader(h => ({ ...h, notas: e.target.value }))}
        />
      </div>

      {/* Ítems */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Ítems</h2>
        </div>

        {/* Buscador de repuestos */}
        <div className="rounded border border-neutral-800 p-3 bg-[#0c0c0c] space-y-2">
          <div className="flex gap-2">
            <input
              className="flex-1 bg-neutral-900 text-white p-2 rounded border border-neutral-800"
              placeholder="Buscar repuesto por nombre, código, categoría, vehículo…"
              value={qRep}
              onChange={(e) => setQRep(e.target.value)}
            />
          </div>

          {repuestosFiltrados.length > 0 && (
            <div className="max-h-56 overflow-y-auto border border-neutral-800 rounded">
              {repuestosFiltrados.map((r: any) => (
                <button
                  key={String(r._id)}
                  type="button"
                  onClick={() => addItemFromRepuesto(String(r._id))}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-900/60 border-b border-neutral-800"
                  title="Agregar a la orden"
                >
                  <div className="text-neutral-100">{r.nombre}</div>
                  <div className="text-xs text-neutral-400">
                    {r.codigo} — {r.categoria} · {r.vehiculo} · ${dinero(Number(r.precioUnitario ?? 0))}
                  </div>
                </button>
              ))}
            </div>
          )}
          {qRep && repuestosFiltrados.length === 0 && (
            <div className="text-sm text-neutral-400 px-1">Sin resultados.</div>
          )}
        </div>

        {/* Tabla de ítems */}
        <div className="rounded border border-neutral-800 overflow-hidden bg-[#0c0c0c]">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-100">
              <tr>
                <th className="p-2 text-left">Producto</th>
                <th className="p-2 text-left">Descripción</th>
                <th className="p-2 text-right">Cant.</th>
                <th className="p-2 text-right">P.Unit</th>
                <th className="p-2 text-right">Desc %</th>
                <th className="p-2 text-right">IVA %</th>
                <th className="p-2 text-right">Subtotal</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody className="text-neutral-200">
              {items.map((it, i) => {
                const rep = repuestos.find(r => String(r._id) === it.repuestoId);
                const base = it.cantidadPedida * it.precioUnitario;
                const desc = base * ((it.descuentoPorc ?? 0) / 100);
                const baseNeta = base - desc;
                const iva = baseNeta * ((it.tasaImpuesto ?? 0) / 100);
                const sub = baseNeta + iva;

                return (
                  <tr key={i} className="border-t border-neutral-800">
                    <td className="p-2 align-top">
                      <div className="text-neutral-100">{rep?.nombre ?? '—'}</div>
                      <div className="text-xs text-neutral-400">{rep?.codigo}</div>
                    </td>

                    <td className="p-2">
                      <input
                        className="bg-neutral-900 text-white p-1 rounded w-full border border-neutral-800"
                        placeholder="Detalle / especificación"
                        value={it.descripcion}
                        onChange={(e) => updateItem(i, { descripcion: e.target.value })}
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="number"
                        className="bg-neutral-900 text-white p-1 rounded w-24 text-right border border-neutral-800"
                        placeholder="1"
                        value={it.cantidadPedida}
                        onChange={(e) => updateItem(i, { cantidadPedida: Number(e.target.value) || 0 })}
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="number"
                        className="bg-neutral-900 text-white p-1 rounded w-28 text-right border border-neutral-800"
                        placeholder="Ej: 15000"
                        value={it.precioUnitario}
                        onChange={(e) => updateItem(i, { precioUnitario: Number(e.target.value) || 0 })}
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="number"
                        className="bg-neutral-900 text-white p-1 rounded w-20 text-right border border-neutral-800"
                        placeholder="0"
                        value={it.descuentoPorc ?? 0}
                        onChange={(e) => updateItem(i, { descuentoPorc: Number(e.target.value) || 0 })}
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="number"
                        className="bg-neutral-900 text-white p-1 rounded w-20 text-right border border-neutral-800"
                        placeholder="21"
                        value={it.tasaImpuesto ?? 21}
                        onChange={(e) => updateItem(i, { tasaImpuesto: Number(e.target.value) || 0 })}
                      />
                    </td>

                    <td className="p-2 text-right align-top">{dinero(sub)}</td>

                    <td className="p-2 text-right align-top">
                      <button
                        className="px-2 py-1 bg-red-600/80 hover:bg-red-600 rounded text-white"
                        onClick={() => removeItem(i)}
                        title="Eliminar ítem"
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                );
              })}

              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-neutral-400">
                    Buscá un repuesto y hacé click para agregarlo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={saving}
          className="px-4 py-2 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition"
        >
          {saving ? 'Guardando…' : 'Guardar OC'}
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
