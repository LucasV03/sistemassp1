"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function EditChoferPage() {
  const params = useParams();
  const id = params.id as Id<"choferes">;
  const router = useRouter();

  const chofer = useQuery(api.choferes.obtener, id ? { id } : "skip") ?? null;
  const actualizar = useMutation(api.choferes.actualizar);
  const eliminar = useMutation(api.choferes.eliminar);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    telefono: "",
    licencia: "",
    estado: "ACTIVO" as "ACTIVO" | "INACTIVO",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (chofer) {
      setForm({
        nombre: chofer.nombre,
        apellido: chofer.apellido,
        dni: chofer.dni,
        telefono: chofer.telefono ?? "",
        licencia: chofer.licencia,
        estado: chofer.estado,
      });
    }
  }, [chofer]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.nombre.trim() || !form.apellido.trim() || !form.dni.trim()) {
      setError("Por favor completa todos los campos obligatorios.");
      setLoading(false);
      return;
    }

    try {
      await actualizar({
        id,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        dni: form.dni.trim(),
        telefono: form.telefono.trim(),
        licencia: form.licencia.trim(),
        estado: form.estado,
      });
      router.push("/choferes");
    } catch (err: any) {
      setError(err.message || "Error al actualizar el chofer.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Seguro que deseas eliminar este chofer?")) return;
    setLoading(true);
    try {
      await eliminar({ id });
      router.push("/choferes");
    } finally {
      setLoading(false);
    }
  };

  if (!id)
    return (
      <div className="p-6 text-gray-500 dark:text-gray-300">
        ID de chofer inválido.
      </div>
    );

  if (!chofer)
    return (
      <div className="p-6 text-gray-500 dark:text-gray-300">
        Cargando información del chofer...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8fafa] dark:bg-[#0b1618] p-6 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-2xl mx-auto bg-white dark:bg-[#11292e] rounded-2xl shadow-lg border border-[#e1efef] dark:border-[#1e3c42] p-8 transition-all">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1a3b47] dark:text-[#e6f6f7]">
            Editar Chofer
          </h1>
          <Link
            href="/choferes"
            className="flex items-center gap-2 text-[#36b6b0] hover:text-[#2ca6a4] transition"
          >
            <ArrowLeft size={18} /> Volver
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Nombre y apellido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-[#d2e6e9] dark:border-[#23454e] bg-white dark:bg-[#11292e]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Apellido</label>
              <input
                type="text"
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-[#d2e6e9] dark:border-[#23454e] bg-white dark:bg-[#11292e]"
              />
            </div>
          </div>

          {/* DNI y licencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">DNI</label>
              <input
                type="text"
                name="dni"
                value={form.dni}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-[#d2e6e9] dark:border-[#23454e] bg-white dark:bg-[#11292e]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Licencia</label>
              <input
                type="text"
                name="licencia"
                value={form.licencia}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-[#d2e6e9] dark:border-[#23454e] bg-white dark:bg-[#11292e]"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input
              type="text"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-[#d2e6e9] dark:border-[#23454e] bg-white dark:bg-[#11292e]"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-[#d2e6e9] dark:border-[#23454e] bg-white dark:bg-[#11292e]"
            >
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 transition"
            >
              <Trash2 size={18} /> Eliminar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#36b6b0] text-white font-medium hover:bg-[#2ca6a4] transition-all disabled:opacity-60"
            >
              <Save size={18} />
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
