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
    <div className="min-h-screen bg-[#1b3a3f] text-[#e6f6f7] p-6 space-y-6">
      <h1 className="text-2xl font-bold">Nuevo Depósito</h1>
      <Card className="bg-[#24474d] border border-[#2f6368]">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="grid gap-3">
            <Input
              className="text-gray-100 bg-[#24474d] border border-[#2c5a60] placeholder-gray-400"
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
            <Input
              className="text-gray-100 bg-[#24474d] border border-[#2c5a60] placeholder-gray-400"
              placeholder="Provincia"
              value={form.provincia}
              onChange={(e) => setForm({ ...form, provincia: e.target.value })}
              required
            />
            <Input
              className="text-gray-100 bg-[#24474d] border border-[#2c5a60] placeholder-gray-400"
              placeholder="Ciudad"
              value={form.ciudad}
              onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
              required
            />
            <Input
              className="text-gray-100 bg-[#24474d] border border-[#2c5a60] placeholder-gray-400"
              placeholder="Calle"
              value={form.calle}
              onChange={(e) => setForm({ ...form, calle: e.target.value })}
              required
            />
            <Input
              className="text-gray-100 bg-[#24474d] border border-[#2c5a60] placeholder-gray-400"
              placeholder="Código Postal"
              value={form.codigoPostal}
              onChange={(e) => setForm({ ...form, codigoPostal: e.target.value })}
              required
            />
            <Input
              className="text-gray-100 bg-[#24474d] border border-[#2c5a60] placeholder-gray-400"
              placeholder="Capacidad total"
              type="number"
              value={form.capacidad_total}
              onChange={(e) => setForm({ ...form, capacidad_total: e.target.value })}
            />
            <Button type="submit" className="bg-[#2ca6a4] hover:bg-[#249390]">
              Crear depósito
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
