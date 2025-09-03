"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";

import { Id } from "../../../../convex/_generated/dataModel";

export default function AsignarRepuestoPage() {
  const depositos = useQuery(api.depositos.listar);
  const repuestos = useQuery(api.repuestos.listar);
  const asignar = useMutation(api.repuestos_por_deposito.asignar);

  const [depositoId, setDepositoId] = useState<Id<"depositos"> | null>(null);
  const [repuestoId, setRepuestoId] = useState<Id<"repuestos"> | null>(null);
  const [stock, setStock] = useState<number>(0);

  const handleSubmit = async () => {
    if (!depositoId || !repuestoId) return;
    await asignar({
      depositoId,
      repuestoId,
      stockInicial: stock,
    });
  };

  return (

    <div>
      <select
        onChange={(e) =>
          setDepositoId(e.target.value as Id<"depositos">) // ✅ casteo
        }
      >
        <option value="">Seleccionar depósito</option>
        {depositos?.map((d) => (
          <option key={d._id} value={d._id}>
            {d.nombre}
          </option>
        ))}
      </select>

      <select
        onChange={(e) =>
          setRepuestoId(e.target.value as Id<"repuestos">) // ✅ casteo
        }
      >
        <option value="">Seleccionar repuesto</option>
        {repuestos?.map((r) => (
          <option key={r._id} value={r._id}>
            {r.nombre}
          </option>
        ))}
      </select>

      <input
        type="number"
        value={stock}
        onChange={(e) => setStock(Number(e.target.value))}
      />

      <button onClick={handleSubmit}>Asignar</button>
    </div>
  );
}