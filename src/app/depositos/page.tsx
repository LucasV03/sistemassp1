"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export default function DepositosPage() {
  // === DATA ===
  const depositos = useQuery(api.depositos.listar);
  const eliminarDeposito = useMutation(api.depositos.eliminar);

  // Ocupación de cada depósito
  const ocupados = useQuery(api.repuestos_por_deposito.ocupadoPorDeposito, {
    depositoId: undefined,
  });

  // === SELECT DE DEPÓSITO ===
  const [selectedDeposito, setSelectedDeposito] = useState<string | "all">("all");

  const repuestosPorDeposito = useQuery(
    api.repuestos_por_deposito.listarPorDeposito,
    {
      depositoId: selectedDeposito === "all" ? undefined : (selectedDeposito as any),
    }
  );

  // === CALCULO DE ESTADÍSTICAS ===
  const stats = useMemo(() => {
    if (!depositos || !ocupados) return null;

    let filtered = depositos;
    if (selectedDeposito !== "all") {
      filtered = depositos.filter((d: any) => d._id === selectedDeposito);
    }

    let capacidadTotal = 0;
    let ocupado = 0;

    for (const d of filtered) {
      capacidadTotal += d.capacidad_total || 0;
      ocupado += ocupados[d._id] || 0;
    }

    const porcentaje =
      capacidadTotal > 0 ? ((ocupado / capacidadTotal) * 100).toFixed(1) : 0;

    return {
      capacidadTotal,
      ocupado,
      porcentaje,
      cantidadDepositos: filtered.length,
    };
  }, [depositos, ocupados, selectedDeposito]);

  const handleDelete = async (id: string) => {
    await eliminarDeposito({ id: id as any });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Gestión de Depósitos</h1>
        <Link href="/depositos/nuevo">
          <Button className="bg-indigo-700">Nuevo depósito</Button>
        </Link>
      </div>

      {/* === CUADROS DE ESTADÍSTICAS === */}
      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="bg-zinc-800 text-white">
              <CardContent className="p-4">
                <p className="text-sm">Capacidad total</p>
                <p className="text-xl font-bold">{stats.capacidadTotal}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800 text-white">
              <CardContent className="p-4">
                <p className="text-sm">Ocupado</p>
                <p className="text-xl font-bold">{stats.ocupado}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800 text-white">
              <CardContent className="p-4">
                <p className="text-sm">% Ocupado</p>
                <p className="text-xl font-bold">{stats.porcentaje}%</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800 text-white">
              <CardContent className="p-4">
                <p className="text-sm"># Depósitos</p>
                <p className="text-xl font-bold">{stats.cantidadDepositos}</p>
              </CardContent>
            </Card>
          </div>

          {/* === SELECT DE DEPÓSITO === */}
          <div className="mt-4">
            <Select
              value={selectedDeposito}
              onValueChange={(val) => setSelectedDeposito(val)}
            >
              <SelectTrigger className="w-[250px] bg-slate-800 text-white border border-gray-600 rounded-lg px-3 py-2  ">
                <SelectValue placeholder="Selecciona depósito" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 text-white">
                <SelectItem value="all">Todos</SelectItem>
                {depositos?.map((d: any) => (
                  <SelectItem key={d._id} value={d._id}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* === LISTA DE DEPÓSITOS === */}
      <div className="grid gap-4 rounded-xl">
  {depositos?.map((d: any) => {
    // Mostrar SIEMPRE todos los depósitos
    return (
      <Card className="text-zinc-400 bg-zinc-800" key={d._id}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-white">{d.nombre}</p>
              <p className="text-sm text-gray-600">
                {d.provincia} - {d.ciudad}
              </p>
              <p className="text-sm">{d.calle}</p>
              <p className="text-sm">CP: {d.codigoPostal}</p>
              <p className="text-sm">
                Capacidad: {d.capacidad_total ?? "Sin límite"}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/depositos/${d._id}`}>
                <Button 
                className="bg-sky-600 border-hidden text-white"
                variant="outline">Ver detalles</Button>
              </Link>
              <Link href={`/depositos/${d._id}/editar`}>
                <Button
                  className="bg-indigo-700 border-hidden text-white"
                  variant="outline"
                >
                  Editar
                </Button>
              </Link>
              <Button
                className="bg-red-600 border-hidden"
                variant="destructive"
                onClick={() => handleDelete(d._id)}
              >
                Eliminar
              </Button>
            </div>
          </div>

          {/* Mostrar repuestos SOLO si el depósito seleccionado coincide */}
          {selectedDeposito === d._id && repuestosPorDeposito && (
            <Card className="bg-zinc-900 text-white mt-6">
              <CardContent className="p-4">
                <h2 className="text-lg font-bold mb-3">
                  Repuestos en este depósito:
                </h2>
                <div className="space-y-3">
                  {repuestosPorDeposito.map((r: any) => (
                    <div
                      key={r._id}
                      className="flex items-center justify-between"
                    >
                      <span>{r.nombre}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          {r.cantidad} unidades
                        </span>
                      </div>
                    </div>
                  ))}
                  {repuestosPorDeposito.length === 0 && (
                    <p className="text-sm text-gray-400">
                      No hay repuestos en este depósito.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    );
  })}
</div>
    </div>
  );
}
