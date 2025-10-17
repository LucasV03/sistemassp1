"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NuevoClienteVentas() {
  const router = useRouter();
  const crear = useMutation(api.clientes_ventas.crear);

  // 🧱 Estados del formulario
  const [alias, setAlias] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [cuit, setCuit] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [provincia, setProvincia] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [estado, setEstado] = useState<"ACTIVO" | "INACTIVO">("ACTIVO");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!razonSocial || !cuit || !direccion || !telefono) {
      setError("Por favor completa todos los campos obligatorios (*).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await crear({
        alias,
        razonSocial,
        cuit,
        direccion,
        telefono,
        email,
        provincia,
        ciudad,
        codigoPostal,
        estado,
      });

      router.push("/clientes-ventas");
    } catch (err: any) {
      console.error("❌ Error en crear cliente:", err);
      setError(err.message || "Error al guardar el cliente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1b3a3f] p-8 text-[#e8f9f9]">
      <div className="max-w-3xl mx-auto bg-[#24474d] rounded-xl p-8 border border-[#2f6368] shadow-lg space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Nuevo Cliente de Ventas</h1>
          <Link
            href="/clientes-ventas"
            className="flex items-center gap-2 text-[#36b6b0] hover:text-[#2ca6a4]"
          >
            <ArrowLeft size={18} /> Volver
          </Link>
        </div>

        {error && (
          <div className="bg-red-800/30 text-red-300 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Alias + Razón social */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm mb-1 block">Alias</label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f]"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Nombre corto o alias"
              />
            </div>
            <div>
              <label className="text-sm mb-1 block">Razón Social *</label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f]"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
              />
            </div>
          </div>

          {/* CUIT + Teléfono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm mb-1 block">CUIT *</label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f]"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                placeholder="Ej: 20-93369269-5"
              />
            </div>
            <div>
              <label className="text-sm mb-1 block">Teléfono *</label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f]"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
          </div>

          {/* Dirección + Email */}
          <div>
            <label className="text-sm mb-1 block">Dirección *</label>
            <input
              className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f]"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm mb-1 block">Correo electrónico</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@empresa.com"
            />
          </div>

          {/* Provincia + Ciudad + CP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm mb-1 block">Provincia</label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f]"
                value={provincia}
                onChange={(e) => setProvincia(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm mb-1 block">Ciudad</label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f]"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm mb-1 block">Código Postal</label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f]"
                value={codigoPostal}
                onChange={(e) => setCodigoPostal(e.target.value)}
              />
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="text-sm mb-1 block">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as "ACTIVO" | "INACTIVO")}
              className="w-full px-4 py-2 rounded-lg border border-[#2f6368] bg-[#1b3a3f]"
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-semibold transition disabled:opacity-60"
          >
            <Save size={18} />
            {loading ? "Guardando..." : "Guardar cliente"}
          </button>
        </form>
      </div>
    </div>
  );
}
