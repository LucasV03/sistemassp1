"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PendientesPage() {
  const pendientes = useQuery(api.movimientos.listarTodos) || [];
  const confirmarMovimiento = useMutation(api.movimientos.confirmarMovimiento);

  // Filtrar solo ingresos no confirmados
  const ingresosPendientes = pendientes.filter(
    (m: any) => m.tipoMovimiento?.ingreso_egreso === "ingreso" && !m.confirmado
  );

  if (ingresosPendientes.length === 0) {
    return <p className="p-6 text-white">No hay ingresos pendientes</p>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-white">📥 Ingresos pendientes</h1>
      {ingresosPendientes.map((m: any) => (
        <Card key={m._id} className="bg-zinc-900">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-white font-semibold">
                {m.tipoComprobante?.nombre} - {m.tipoMovimiento?.nombre}
              </p>
              <p className="text-sm text-zinc-400">
                Depósito: {m.deposito?.nombre}
              </p>
              <p className="text-sm text-zinc-400">
                Fecha: {m.fecha_registro} {m.hora_registro}
              </p>
            </div>
            <Button
              className="bg-green-700 text-white"
              onClick={() => confirmarMovimiento({ movimientoId: m._id })}
            >
              Confirmar
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
