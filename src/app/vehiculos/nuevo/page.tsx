"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArrowLeft, Save, CheckCircle, Plus } from "lucide-react";
import Link from "next/link";

export default function NuevoVehiculoPage() {
  const router = useRouter();
  const crearVehiculo = useMutation(api.vehiculos.crear);
  const crearMarca = useMutation(api.marcas_vehiculos.crear);
  const marcas = useQuery(api.marcas_vehiculos.listar, {}) ?? [];

  // Estado del formulario
  const [nombre, setNombre] = useState("");
  const [marcaVehiculoId, setMarcaVehiculoId] = useState("");
  const [patente, setPatente] = useState("");
  const [tipo, setTipo] = useState("COLECTIVO");
  const [capacidad, setCapacidad] = useState<number | "">("");
  const [estado, setEstado] = useState("OPERATIVO");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Modal nueva marca
  const [showModal, setShowModal] = useState(false);
  const [nuevaMarca, setNuevaMarca] = useState("");
  const [loadingMarca, setLoadingMarca] = useState(false);

  // Guardar vehículo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !marcaVehiculoId) {
      setError("El nombre y la marca son obligatorios.");
      return;
    }

    try {
      await crearVehiculo({
        nombre,
        marcaVehiculoId: marcaVehiculoId as any,
        patente: patente || undefined,
        tipo: tipo || undefined,
        capacidad: capacidad ? Number(capacidad) : undefined,
        estado: estado as any,
      });

      setSuccess(true);
      setTimeout(() => router.push("/vehiculos"), 1500);
    } catch (err) {
      console.error(err);
      setError("Error al crear el vehículo.");
    }
  };

  // Crear nueva marca
  const handleCrearMarca = async () => {
    if (!nuevaMarca.trim()) return;
    setLoadingMarca(true);
    try {
      const id = await crearMarca({ nombre: nuevaMarca });
      setMarcaVehiculoId(id as string);
      setNuevaMarca("");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Error al crear la marca");
    } finally {
      setLoadingMarca(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1b1e] text-[#e8f9f9] p-8 space-y-8 transition-colors duration-300">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/vehiculos"
          className="flex items-center gap-2 text-[#36b6b0] hover:text-[#2ca6a4] transition"
        >
          <ArrowLeft size={20} />
          Volver
        </Link>
        <h1 className="text-2xl font-bold">Nuevo Vehículo</h1>
      </div>

      {/* FORMULARIO */}
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl bg-[#24474d] border border-[#2f6368] rounded-xl shadow-lg p-8 space-y-6"
      >
        {error && (
          <div className="p-3 rounded bg-red-900/30 text-red-400 border border-red-800">
            {error}
          </div>
        )}

        <Field label="Nombre / Alias del vehículo *">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Colectivo ALE"
            className="input-dark"
          />
        </Field>

        {/* Marca + Nueva */}
        <Field label="Marca *">
          <div className="flex gap-2">
            <select
              value={marcaVehiculoId}
              defaultValue=""
              onChange={(e) => setMarcaVehiculoId(e.target.value)}
              className="input-dark flex-1"
            >
              <option value="" disabled hidden>
                Seleccionar marca...
              </option>
              {marcas.map((m: any) => (
                <option key={m._id} value={m._id}>
                  {m.nombre}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[#2ca6a4] hover:bg-[#249390] text-white font-semibold transition text-sm"
            >
              <Plus size={16} /> Nueva
            </button>
          </div>
        </Field>

        {/* Patente */}
        <Field label="Patente">
          <input
            type="text"
            value={patente}
            onChange={(e) => setPatente(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="input-dark"
          />
        </Field>

        {/* Tipo de transporte */}
        <Field label="Tipo de transporte *">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="input-dark"
          >
            <option value="COLECTIVO">Colectivo</option>
            <option value="TRAFFIC">Tráffic / Minibús</option>
            <option value="COMBI">Combi</option>
            <option value="OTRO">Otro</option>
          </select>
        </Field>

        {/* Capacidad */}
        <Field label="Capacidad (personas)">
          <input
            type="number"
            value={capacidad}
            onChange={(e) =>
              setCapacidad(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="Ej: 45"
            className="input-dark"
          />
        </Field>

        {/* Estado */}
        <Field label="Estado">
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="input-dark"
          >
            <option value="OPERATIVO">Operativo</option>
            <option value="MANTENIMIENTO">Mantenimiento</option>
            <option value="FUERA_SERVICIO">Fuera de servicio</option>
          </select>
        </Field>

        {/* Botones */}
        <div className="flex justify-end mt-8 gap-4">
          <Link
            href="/vehiculos"
            className="px-5 py-2 rounded-lg bg-[#3b555a] hover:bg-[#466266] text-[#e8f9f9] font-semibold transition"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#2ca6a4] hover:bg-[#249390] text-white font-semibold shadow transition"
          >
            <Save size={18} />
            Guardar Vehículo
          </button>
        </div>
      </form>

      {/* MODAL NUEVA MARCA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#24474d] border border-[#2f6368] rounded-xl p-6 w-[400px] shadow-xl space-y-4">
            <h2 className="text-xl font-semibold text-[#e8f9f9]">
              Nueva Marca de Vehículo
            </h2>
            <input
              type="text"
              value={nuevaMarca}
              onChange={(e) => setNuevaMarca(e.target.value)}
              placeholder="Ej: Mercedes-Benz, Iveco, Volvo..."
              className="input-dark w-full"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-[#3b555a] hover:bg-[#466266] text-[#e8f9f9] font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearMarca}
                disabled={loadingMarca}
                className="px-4 py-2 rounded-lg bg-[#2ca6a4] hover:bg-[#249390] text-white font-semibold"
              >
                {loadingMarca ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ÉXITO */}
      {success && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn z-50">
          <div className="bg-[#24474d] border border-[#2f6368] rounded-2xl p-8 flex flex-col items-center shadow-xl transform animate-scaleIn">
            <CheckCircle className="text-[#36b6b0] mb-3" size={60} />
            <h3 className="text-2xl font-bold mb-1">Vehículo creado con éxito</h3>
            <p className="text-[#a8d8d3]">Redirigiendo al listado...</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-dark {
          width: 100%;
          border-radius: 0.5rem;
          background-color: #1b3a3f;
          border: 1px solid #2f6368;
          padding: 0.5rem 0.75rem;
          color: #e8f9f9;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-dark:focus {
          border-color: #36b6b0;
          box-shadow: 0 0 0 2px #36b6b033;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}

/* ---------- COMPONENTE FIELD ---------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#a8d8d3]">{label}</label>
      {children}
    </div>
  );
}
