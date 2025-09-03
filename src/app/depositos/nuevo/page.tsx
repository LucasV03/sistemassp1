"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function NuevoDepositoPage() {
  const crearDeposito = useMutation(api.depositos.crear);
  const [form, setForm] = useState({
    nombre: "",
    provincia: "",
    ciudad: "",
    calle: "",
    codigoPostal: "",
    capacidad_total: "",
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await crearDeposito({
      nombre: form.nombre,
      provincia: form.provincia,
      ciudad: form.ciudad,
      calle: form.calle,
      codigoPostal: form.codigoPostal,
      capacidad_total: form.capacidad_total ? Number(form.capacidad_total) : undefined,
    });
    router.push("/depositos");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Nuevo Depósito</h1>
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
            <Button type="submit" className="bg-indigo-700">
              Crear depósito
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
