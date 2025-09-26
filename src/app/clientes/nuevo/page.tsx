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
    <div className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-xl font-bold mb-4">Registrar nuevo cliente</h1>
      <form onSubmit={handleSubmit}>
        <input
          className="border rounded px-3 py-2 mb-2 w-full bg-black text-white placeholder-gray-400"
          placeholder="Nombre"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
        />
        <input
          className="border rounded px-3 py-2 mb-2 w-full bg-black text-white placeholder-gray-400"
          placeholder="Correo"
          type="email"
          value={correo}
          onChange={e => setCorreo(e.target.value)}
          required
        />
        <input
          className="border rounded px-3 py-2 mb-2 w-full bg-black text-white placeholder-gray-400"
          placeholder="Teléfono"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          required
        />
        <input
          className="border rounded px-3 py-2 mb-2 w-full bg-black text-white placeholder-gray-400"
          placeholder="Empresa"
          value={empresa}
          onChange={e => setEmpresa(e.target.value)}
        />
        <button className="px-4 py-2 rounded bg-white text-black" type="submit">
          Guardar
        </button>
        {error && <div className="mt-2 text-red-400">{error}</div>}
        {exito && <div className="mt-2 text-green-400">Cliente registrado correctamente.</div>}
      </form>
    </div>
  );
}