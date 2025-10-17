"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NuevoChoferPage() {
  const router = useRouter();
  const crearChofer = useMutation(api.choferes.crear);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [licencia, setLicencia] = useState("");
  const [estado, setEstado] = useState<"ACTIVO" | "INACTIVO">("ACTIVO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!nombre.trim() || !apellido.trim() || !dni.trim()) {
      setError("Por favor completa todos los campos obligatorios.");
      setLoading(false);
      return;
    }

    try {
      await crearChofer({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        telefono: telefono.trim(),
        licencia: licencia.trim(),
        estado,
      });
      router.push("/choferes");
    } catch (err: any) {
      setError(err.message || "Error al guardar el chofer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafa] dark:bg-[#0b1618] p-6 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-2xl mx-auto bg-white dark:bg-[#11292e] rounded-2xl shadow-lg border border-[#e1efef] dark:border-[#1e3c42] p-8 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1a3b47] dark:text-[#e6f6f7]">
            Nuevo Chofer
          </h1>
          <Link
            href="/choferes"
            className="flex items-center gap-2 text-[#36b6b0] hover:text-[#2ca6a4] transition"
          >
            <ArrowLeft size={18} /> Volver
          </Link>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-[#d2e6e9] dark:border-[#23454e] bg-white dark:bg-[#11292e] focus:ring-2 focus:ring-[#36b6b0] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Apellido</label>
              <input
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-[#d2e6e9] dark:border-[#23454e] bg-white dark:bg-[#11292e] focus:ring-2 focus:ring-[#36b6b0] focus:outline-none"
              />
            </div>
          </div>

          {/* DNI y Licencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">DNI</label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-[#d2e6e9] dark:border-[#23454e] bg-white dark:bg-[#11292e]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Licencia</label>
              <input
                type="text"
                value={licencia}
                onChange={(e) => setLicencia(e.target.value)}
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
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#d2e6e9] dark:border-[#23454e] bg-white dark:bg-[#11292e]"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as "ACTIVO" | "INACTIVO")}
              className="w-full px-4 py-2 rounded-lg border border-[#d2e6e9] dark:border-[#23454e] bg-white dark:bg-[#11292e]"
            >
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#36b6b0] text-white font-medium hover:bg-[#2ca6a4] transition disabled:opacity-60"
          >
            <Save size={18} />
            {loading ? "Guardando..." : "Guardar Chofer"}
          </button>
        </form>
      </div>
    </div>
  );
}
