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
    <div className="min-h-screen bg-[#1b3a3f] text-[#e6f6f7] p-6">
      <div className="max-w-2xl mx-auto bg-[#24474d] rounded-2xl shadow border border-[#2f6368] p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1a3b47] dark:text-[#e6f6f7]">
            Nuevo Chofer
          </h1>
          <Link href="/choferes" className="px-3 py-1.5 rounded-lg border border-[#2f6368] bg-[#2b5a60] hover:bg-[#2f6368]">
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
              <label className="block text-sm font-medium mb-1 text-[#b7e2de]">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-[#2c5a60] bg-[#24474d] text-gray-100 focus:ring-2 focus:ring-[#36b6b0] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[#b7e2de]">Apellido</label>
              <input
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-[#2c5a60] bg-[#24474d] text-gray-100 focus:ring-2 focus:ring-[#36b6b0] focus:outline-none"
              />
            </div>
          </div>

          {/* DNI y Licencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#b7e2de]">DNI</label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-[#2c5a60] bg-[#24474d] text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[#b7e2de]">Licencia</label>
              <input
                type="text"
                value={licencia}
                onChange={(e) => setLicencia(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-[#2c5a60] bg-[#24474d] text-gray-100"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium mb-1 text-[#b7e2de]">Teléfono</label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#2c5a60] bg-[#24474d] text-gray-100"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium mb-1 text-[#b7e2de]">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as "ACTIVO" | "INACTIVO")}
              className="w-full px-3 py-2 rounded-lg border border-[#2c5a60] bg-[#24474d] text-gray-100"
            >
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>

          {/* Botón */}
          <button type="submit" disabled={loading} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2ca6a4] hover:bg-[#249390] text-white font-medium transition disabled:opacity-60">
            <Save size={18} />
            {loading ? "Guardando..." : "Guardar Chofer"}
          </button>
        </form>
      </div>
    </div>
  );
}
