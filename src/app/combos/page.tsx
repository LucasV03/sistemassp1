"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";

// 🔹 Tipo literal permitido
type Medio = "TRANSFERENCIA" | "EFECTIVO" | "CHEQUE" | "TARJETA" | "OTRO";

export default function CombosPage() {
  const combos = useQuery(api.combos_pago.listar) ?? [];
  const crear = useMutation(api.combos_pago.crear);
  const desactivar = useMutation(api.combos_pago.desactivar);

  const [nombre, setNombre] = useState("");
  const [componentes, setComponentes] = useState<
    { medio: Medio; porcentaje?: number; montoFijo?: number }[]
  >([{ medio: "EFECTIVO", porcentaje: 100 }]);

  return (
    <div className="p-6 text-white bg-[#0b1618] min-h-screen space-y-6">
      <h1 className="text-2xl font-bold">Combos de métodos de pago</h1>

      {/* Crear nuevo combo */}
      <div className="bg-[#11292e] border border-[#1e3c42] p-4 rounded-xl space-y-4">
        <input
          className="inp"
          placeholder="Nombre del combo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        {/* Métodos de pago dentro del combo */}
        {componentes.map((c, i) => (
          <div key={i} className="flex gap-3 items-center">
            <select
              className="inp w-40"
              value={c.medio}
              onChange={(e) => {
                const updated = [...componentes];
                updated[i].medio = e.target.value as Medio;
                setComponentes(updated);
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
              className="inp w-28 text-right"
              placeholder="%"
              value={c.porcentaje ?? ""}
              onChange={(e) => {
                const updated = [...componentes];
                updated[i].porcentaje = parseFloat(e.target.value) || 0;
                setComponentes(updated);
              }}
            />

            <button
              onClick={() =>
                setComponentes(componentes.filter((_, idx) => idx !== i))
              }
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          onClick={() =>
            setComponentes([...componentes, { medio: "EFECTIVO", porcentaje: 0 }])
          }
          className="px-3 py-1 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-medium transition"
        >
          + Agregar método
        </button>

        <button
          onClick={() =>
            crear({
              nombre,
              componentes: componentes.map((c) => ({
                medio: c.medio as Medio,
                porcentaje: c.porcentaje,
                montoFijo: c.montoFijo,
              })),
            })
          }
          className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500"
        >
          Crear combo
        </button>
      </div>

      {/* Listado de combos */}
      <div className="space-y-2">
        {combos.map((c) => (
          <div
            key={c._id}
            className="flex justify-between bg-[#11292e] border border-[#1e3c42] p-3 rounded-lg"
          >
            <span>{c.nombre}</span>
            <button
              onClick={() => desactivar({ id: c._id })}
              className="text-red-400 hover:text-red-300"
            >
              Desactivar
            </button>
          </div>
        ))}
      </div>

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
