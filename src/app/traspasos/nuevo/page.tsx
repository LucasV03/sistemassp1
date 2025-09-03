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
  try {
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
  } catch (err: any) {
    alert(err.message); 
  }
};


  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">➕ Nuevo Traspaso</h1>

      <div className="space-y-4 bg-zinc-800 p-8 border rounded-xl border-white">
        {/* Selección depósitos */}
        <div>
          <label className="text-white ">Origen</label>
          <select
            className="border p-2 rounded w-full text-zinc-500"
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
          <label className="text-white" >Destino</label>
          <select
            className="border p-2 rounded w-full text-zinc-500"
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
          <h2 className="font-semibold text-white">Detalles</h2>
          {detalles.map((d, idx) => (
            <div key={idx} className="flex gap-2">
              <select
                className="border p-2 rounded flex-1 text-zinc-500"
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
                className="border p-2 rounded w-24 text-zinc-500"
                onChange={(e) => {
                  const copy = [...detalles];
                  copy[idx].cantidad = parseInt(e.target.value);
                  setDetalles(copy);
                }}
              />
            </div>
          ))}
          <Button  className="bg-green-700 border-hidden text-white " variant="outline" onClick={addDetalle}>
            ➕ Agregar repuesto
          </Button>
        </div>

        <Button className="w-full bg-indigo-700 text-white w-80 ml-140" onClick={handleSave}>
          Guardar traspaso
        </Button>
      </div>
    </div>
  );
}
