"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";

export default function NuevoTraspasoPage() {
  const depositos = useQuery(api.depositos.listar); // necesitas esta query en convex/depositos.ts
  const repuestos = useQuery(api.repuestos.listar); // idem en convex/repuestos.ts
  const crearTraspaso = useMutation(api.traspasos.crearTraspaso);

  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [detalles, setDetalles] = useState<
    { repuestoId: string; cantidad: number }[]
  >([]);

  const addDetalle = () =>
    setDetalles([...detalles, { repuestoId: "", cantidad: 1 }]);

  const handleSave = async () => {
    if (!origen || !destino || detalles.length === 0) return alert("Completar!");
    await crearTraspaso({
      origenId: origen as any,
      destinoId: destino as any,
      usuario: "admin",
      detalles: detalles.map((d) => ({
        repuestoId: d.repuestoId as any,
        cantidad: d.cantidad,
      })),
    });
    window.location.href = "/traspasos";
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">➕ Nuevo Traspaso</h1>

      <div className="space-y-4">
        {/* Selección depósitos */}
        <div>
          <label>Origen</label>
          <select
            className="border p-2 rounded w-full"
            value={origen}
            onChange={(e) => setOrigen(e.target.value)}
          >
            <option value="">-- Seleccionar --</option>
            {depositos?.map((d) => (
              <option key={d._id} value={d._id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Destino</label>
          <select
            className="border p-2 rounded w-full"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
          >
            <option value="">-- Seleccionar --</option>
            {depositos?.map((d) => (
              <option key={d._id} value={d._id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Detalles */}
        <div className="space-y-2">
          <h2 className="font-semibold">Detalles</h2>
          {detalles.map((d, idx) => (
            <div key={idx} className="flex gap-2">
              <select
                className="border p-2 rounded flex-1"
                value={d.repuestoId}
                onChange={(e) => {
                  const copy = [...detalles];
                  copy[idx].repuestoId = e.target.value;
                  setDetalles(copy);
                }}
              >
                <option value="">-- Repuesto --</option>
                {repuestos?.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={d.cantidad}
                className="border p-2 rounded w-24"
                onChange={(e) => {
                  const copy = [...detalles];
                  copy[idx].cantidad = parseInt(e.target.value);
                  setDetalles(copy);
                }}
              />
            </div>
          ))}
          <Button variant="outline" onClick={addDetalle}>
            ➕ Agregar repuesto
          </Button>
        </div>

        <Button className="w-full" onClick={handleSave}>
          Guardar traspaso
        </Button>
      </div>
    </div>
  );
}
