'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useState } from 'react';

export default function OCDetail() {
  const { id } = useParams<{ id: string }>();
  // Obtener oc + items (ya en español desde tu backend)
  const data = useQuery(api.ordenesCompra.obtener, { id: id as any });
  const recibir = useMutation(api.ordenesCompra.recibir);
  const [rcv, setRcv] = useState<Record<string, number>>({});

  if (!data) return null;
  const { oc, items } = data;

  async function doReceive() {
    const lines = Object.entries(rcv)
      .filter(([, q]) => (q ?? 0) > 0)
      .map(([itemId, cantidad]) => ({ itemId: itemId as any, cantidad }));
    if (lines.length === 0) return;
    await recibir({ ocId: oc._id, items: lines });
    location.reload();
  }

  return (
    <div className="p-6 space-y-4 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{oc.numeroOrden}</h1>
        <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-100">
          {oc.estado}
        </span>
      </div>

      <div className="rounded border border-neutral-800 overflow-hidden bg-[#0c0c0c]">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-100">
            <tr>
              <th className="p-2 text-left">Producto</th>
              <th className="p-2 text-center">Pedida</th>
              <th className="p-2 text-center">Recibida</th>
              <th className="p-2 text-center">A recibir</th>
            </tr>
          </thead>
          <tbody className="text-neutral-200">
            {items.map((it: any) => (
              <tr key={it._id} className="border-t border-neutral-800">
                <td className="p-2">{it.descripcion}</td>
                <td className="p-2 text-center">{it.cantidadPedida}</td>
                <td className="p-2 text-center">{it.cantidadRecibida}</td>
                <td className="p-2 text-center">
                  <input
                    type="number"
                    min={0}
                    max={it.cantidadPedida - it.cantidadRecibida}
                    className="bg-neutral-900 text-white p-1 rounded w-24 text-right border border-neutral-800"
                    value={rcv[it._id] ?? 0}
                    onChange={(e) =>
                      setRcv((s) => ({ ...s, [it._id]: Number(e.target.value) }))
                    }
                  />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-neutral-400">
                  Sin ítems.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition"
        onClick={doReceive}
      >
        Registrar recepción
      </button>
    </div>
  );
}
