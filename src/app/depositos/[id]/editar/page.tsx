"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function EditarDepositoPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // Traer depósito específico
  const deposito = useQuery(api.depositos.obtener, { id: params.id as any });
  const actualizarDeposito = useMutation(api.depositos.actualizar);

  // Estado local
  const [form, setForm] = useState({
    nombre: "",
    provincia: "",
    ciudad: "",
    calle: "",
    codigoPostal: "",
    capacidad_total: "",
  });

  // Cargar datos al montar
  useEffect(() => {
    if (deposito) {
      setForm({
        nombre: deposito.nombre ?? "",
        provincia: deposito.provincia ?? "",
        ciudad: deposito.ciudad ?? "",
        calle: deposito.calle ?? "",
        codigoPostal: deposito.codigoPostal ?? "",
        capacidad_total: deposito.capacidad_total?.toString() ?? "",
      });
    }
  }, [deposito]);

  // Guardar cambios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await actualizarDeposito({
      id: params.id as any,
      nombre: form.nombre,
      provincia: form.provincia,
      ciudad: form.ciudad,
      calle: form.calle,
      codigoPostal: form.codigoPostal,
      capacidad_total: form.capacidad_total ? Number(form.capacidad_total) : undefined,
    });
    router.push("/depositos"); // volver a la lista
  };

  if (!deposito) return <p className="text-white p-4">Cargando...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Editar Depósito</h1>
      <Card className="bg-zinc-800">
        <CardContent className="p-4 text-white">
          <form onSubmit={handleSubmit} className="grid gap-3">
            <Input
              className="text-zinc-300"
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
            <Input
              className="text-zinc-300"
              placeholder="Provincia"
              value={form.provincia}
              onChange={(e) => setForm({ ...form, provincia: e.target.value })}
              required
            />
            <Input
              className="text-zinc-300"
              placeholder="Ciudad"
              value={form.ciudad}
              onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
              required
            />
            <Input
              className="text-zinc-300"
              placeholder="Calle"
              value={form.calle}
              onChange={(e) => setForm({ ...form, calle: e.target.value })}
              required
            />
            <Input
              className="text-zinc-300"
              placeholder="Código Postal"
              value={form.codigoPostal}
              onChange={(e) => setForm({ ...form, codigoPostal: e.target.value })}
              required
            />
            <Input
              className="text-zinc-300"
              placeholder="Capacidad total"
              type="number"
              value={form.capacidad_total}
              onChange={(e) => setForm({ ...form, capacidad_total: e.target.value })}
            />
            <Button type="submit" className="bg-indigo-700 w-100">
              Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
