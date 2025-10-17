"use client";
import { useState } from "react";
import { useMutation } from "convex/react";

import { api } from "../../../../convex/_generated/api"; 
import { useRouter } from "next/navigation";

export default function NuevoCliente() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const crearCliente = useMutation(api.clientes.crear); // Debes tener esta función en Convex
  const router = useRouter();
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setExito(false);

    if (!nombre || !correo || !telefono) {
      setError("Por favor completa todos los campos obligatorios.");
      return;
    }

    try {
      await crearCliente({ nombre, correo, telefono, empresa });
      setExito(true);
      setTimeout(() => router.push("/clientes"), 1200); // Redirige después de guardar
    } catch (err: any) {
      setError("Error al guardar el cliente.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1b1e] text-[#e6f6f7] p-6 flex items-center justify-center">
      <article className="w-full max-w-xl bg-[#11292e] border border-[#1e3c42] rounded-2xl p-6 shadow-sm">
      <h1 className="text-2xl font-bold mb-4">Registrar nuevo cliente</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
          placeholder="Nombre"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
          placeholder="Correo"
          type="email"
          value={correo}
          onChange={e => setCorreo(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
          placeholder="Teléfono"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg border border-[#23454e] bg-[#11292e] text-gray-200 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b6b0]"
          placeholder="Empresa"
          value={empresa}
          onChange={e => setEmpresa(e.target.value)}
        />
        <button className="px-6 py-2.5 rounded-lg bg-[#2ca6a4] hover:bg-[#249390] text-white font-semibold shadow-sm" type="submit">
          Guardar
        </button>
        {error && <div className="mt-2 text-red-300">{error}</div>}
        {exito && <div className="mt-2 text-emerald-300">Cliente registrado correctamente.</div>}
      </form>
      </article>
    </div>
  );
}
