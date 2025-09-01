"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function DepositosPage() {
  // === DATA ===
  const depositos = useQuery(api.depositos.listar);
  const crearDeposito = useMutation(api.depositos.crear);
  const actualizarDeposito = useMutation(api.depositos.actualizar);
  const eliminarDeposito = useMutation(api.depositos.eliminar);

  // === FORM STATE ===
  const [form, setForm] = useState({
  id: null as string | null,
  nombre: "",
  provincia: "",
  ciudad: "",
  calle: "",
  codigoPostal: "",
  capacidad_total: "" as string | number,
});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.id) {
      // Actualizar
      await actualizarDeposito({
        id: form.id as any,
        nombre: form.nombre,
        provincia: form.provincia,
        ciudad: form.ciudad,
        calle: form.calle,
        codigoPostal: form.codigoPostal,
        capacidad_total: form.capacidad_total
  ? Number(form.capacidad_total)
  : undefined,

      });
    } else {
      // Crear
      await crearDeposito({
        nombre: form.nombre,
        provincia: form.provincia,
        ciudad: form.ciudad,
        calle: form.calle,
        codigoPostal: form.codigoPostal,
        capacidad_total: form.capacidad_total
  ? Number(form.capacidad_total)
  : undefined,

      });
    }

    // Resetear formulario
    setForm({
      id: null,
      nombre: "",
      provincia: "",
      ciudad: "",
      calle: "",
      codigoPostal: "",
      capacidad_total: "",
    });
  };

  const handleEdit = (d: any) => {
    setForm({
      id: d._id,
      nombre: d.nombre,
      provincia: d.provincia ?? "",
      ciudad: d.ciudad ?? "",
      calle: d.calle ?? "",
      codigoPostal: d.codigoPostal ?? "",
      capacidad_total: d.capacidad_total ?? "",
    });
  };

  const handleDelete = async (id: string) => {
    await eliminarDeposito({ id: id as any });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Gestión de Depósitos</h1>

      {/* === FORM === */}
      <Card className="bg-zinc-800">
        <CardContent className="p-4 text-white">
          <form onSubmit={handleSubmit} className="grid gap-3 ">
            <Input
              className="text-white"
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
            <Input
              className="text-white"
              placeholder="Provincia"
              value={form.provincia}
              onChange={(e) => setForm({ ...form, provincia: e.target.value })}
              required
            />
            <Input
              className="text-white"
              placeholder="Ciudad"
              value={form.ciudad}
              onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
              required
            />
            <Input
              className="text-white"
              placeholder="Calle"
              value={form.calle}
              onChange={(e) => setForm({ ...form, calle: e.target.value })}
              required
            />
            <Input
              className="text-white"
              placeholder="Código Postal"
              value={form.codigoPostal}
              onChange={(e) =>
                setForm({ ...form, codigoPostal: e.target.value })
              }
              required
            />
            <Input
              className="text-white"
              placeholder="Capacidad total"
              type="number"
              value={form.capacidad_total}
              onChange={(e) =>
                setForm({ ...form, capacidad_total: e.target.value })
              }
            />
            <Button type="submit" className="bg-indigo-700 w-100 ml-125 text-white">
              {form.id ? "Actualizar depósito" : "Crear depósito"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* === LISTA === */}
      <div className="grid gap-4 bg-zinc-800 rounded-xl">
        {depositos?.map((d: any) => (
          <Card key={d._id}>
            <CardContent className="flex items-center justify-between p-4">
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
              <div className="flex gap-2 ">
                <Button className="bg-indigo-700 text-white " variant="outline" onClick={() => handleEdit(d)}>
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(d._id)}
                >
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
