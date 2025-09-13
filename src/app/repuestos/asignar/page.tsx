"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "../../../components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    setDepositoId(null);
    setRepuestoId(null);
    setStock(0);
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-6">
      <Card className="w-full max-w-md shadow-lg rounded-2xl bg-slate-500">
        <CardContent className="p-6 space-y-6">
          <h1 className="text-xl font-bold text-gray-800">
            ➕ Asignar Repuesto a Depósito
          </h1>

          {/* Select Depósito */}
          <div className="space-y-2">
            <Label htmlFor="deposito">Depósito</Label>
            <select
              id="deposito"
              className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 p-2"
              value={depositoId ?? ""}
              onChange={(e) => setDepositoId(e.target.value as Id<"depositos">)}
            >
              <option value="">Seleccionar depósito</option>
              {depositos?.map((d) => (
                <option key={String(d._id)} value={String(d._id)}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Select Repuesto */}
          <div className="space-y-2">
            <Label htmlFor="repuesto">Repuesto</Label>
            <select
              id="repuesto"
              className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 p-2"
              value={repuestoId ?? ""}
              onChange={(e) => setRepuestoId(e.target.value as Id<"repuestos">)}
            >
              <option value="">Seleccionar repuesto</option>
              {repuestos?.map((r) => (
                <option key={String(r._id)} value={String(r._id)}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Input Stock */}
          <div className="space-y-2">
            <Label htmlFor="stock">Stock Inicial</Label>
            <Input
              id="stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              placeholder="Ingrese cantidad"
            />
          </div>

          {/* Botón */}
          <Button
            onClick={handleSubmit}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2"
          >
            Asignar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
