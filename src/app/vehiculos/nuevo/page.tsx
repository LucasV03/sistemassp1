"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArrowLeft, Save, CheckCircle, Plus } from "lucide-react";
import Link from "next/link";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function NuevoVehiculoPage() {
  const router = useRouter();

  // Mutations
  const crearVehiculo = useMutation(api.vehiculos.crear);
  const crearMarca = useMutation(api.marcas_vehiculos.crear);
  const crearTipo = useMutation(api.tipos_vehiculo.crear);

  // Queries
  const marcas = useQuery(api.marcas_vehiculos.listar, {}) ?? [];
  const tipos = useQuery(api.tipos_vehiculo.listar, {}) ?? [];

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [marcaVehiculoId, setMarcaVehiculoId] = useState("");
  const [tipoVehiculoId, setTipoVehiculoId] = useState("");
  const [patente, setPatente] = useState("");
  const [capacidad, setCapacidad] = useState<number | "">("");
  const [estado, setEstado] = useState("OPERATIVO");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Modales
  const [showMarcaModal, setShowMarcaModal] = useState(false);
  const [showTipoModal, setShowTipoModal] = useState(false);
  const [nuevaMarca, setNuevaMarca] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [loadingMarca, setLoadingMarca] = useState(false);
  const [loadingTipo, setLoadingTipo] = useState(false);

  /* ============================================================
     ✅ CREAR VEHÍCULO
  ============================================================ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !marcaVehiculoId || !tipoVehiculoId) {
      setError("El nombre, la marca y el tipo de vehículo son obligatorios.");
      return;
    }

    try {
      await crearVehiculo({
        nombre,
        marcaVehiculoId: marcaVehiculoId as Id<"marcas_vehiculos">,
        tipoVehiculoId: tipoVehiculoId as Id<"tipos_vehiculo">,
        patente: patente || undefined,
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

  /* ============================================================
     🚗 NUEVA MARCA
  ============================================================ */
  const handleCrearMarca = async () => {
    if (!nuevaMarca.trim()) return;
    setLoadingMarca(true);
    try {
      const id = await crearMarca({ nombre: nuevaMarca });
      setMarcaVehiculoId(String(id));
      setNuevaMarca("");
      setShowMarcaModal(false);
    } catch {
      alert("Error al crear la marca.");
    } finally {
      setLoadingMarca(false);
    }
  };

  /* ============================================================
     🚚 NUEVO TIPO
  ============================================================ */
  const handleCrearTipo = async () => {
    if (!nuevoTipo.trim()) return;
    setLoadingTipo(true);
    try {
      const id = await crearTipo({ nombre: nuevoTipo });
      setTipoVehiculoId(String(id));
      setNuevoTipo("");
      setShowTipoModal(false);
    } catch {
      alert("Error al crear el tipo de vehículo.");
    } finally {
      setLoadingTipo(false);
    }
  };

  /* ============================================================
     🎨 UI PRINCIPAL
  ============================================================ */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d1b1e] text-[#e8f9f9] p-6">
      {/* HEADER */}
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between">
        <Link
          href="/vehiculos"
          className="flex items-center gap-2 text-[#36b6b0] hover:text-[#2ca6a4] transition"
        >
          <ArrowLeft size={20} />
          Volver
        </Link>
        <h1 className="text-3xl font-bold text-center flex-1 text-[#e8f9f9] drop-shadow-md">
          Nuevo Vehículo
        </h1>
      </div>

      {/* FORMULARIO */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-gradient-to-br from-[#102528] to-[#123136] border border-[#1e3c42]/70 rounded-2xl shadow-2xl p-8 space-y-6 transition-all duration-300 hover:border-[#2ca6a4]/50"
      >
        {error && (
          <div className="p-3 rounded-lg bg-red-900/30 text-red-400 border border-red-800">
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
            required
          />
        </Field>

        <Field label="Marca *">
          <div className="flex gap-2">
            <select
              value={marcaVehiculoId}
              onChange={(e) => setMarcaVehiculoId(e.target.value)}
              className="input-dark flex-1"
              required
            >
              <option value="">Seleccionar marca...</option>
              {marcas.map((m: any) => (
                <option key={m._id} value={m._id}>
                  {m.nombre}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowMarcaModal(true)}
              className="btn-teal"
            >
              <Plus size={16} /> Nueva
            </button>
          </div>
        </Field>

        <Field label="Tipo de vehículo *">
          <div className="flex gap-2">
            <select
              value={tipoVehiculoId}
              onChange={(e) => setTipoVehiculoId(e.target.value)}
              className="input-dark flex-1"
              required
            >
              <option value="">Seleccionar tipo...</option>
              {tipos.map((t: any) => (
                <option key={t._id} value={t._id}>
                  {t.nombre}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowTipoModal(true)}
              className="btn-teal"
            >
              <Plus size={16} /> Nuevo
            </button>
          </div>
        </Field>

        <Field label="Patente">
          <input
            type="text"
            value={patente}
            onChange={(e) => setPatente(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="input-dark"
          />
        </Field>

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

        <div className="flex justify-end mt-10 gap-4">
          <Link
            href="/vehiculos"
            className="btn-outline"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="btn-teal px-5 py-2.5 flex items-center gap-2 font-semibold"
          >
            <Save size={18} />
            Guardar Vehículo
          </button>
        </div>
      </form>

      {showMarcaModal && (
        <Modal
          title="Nueva Marca de Vehículo"
          value={nuevaMarca}
          onChange={setNuevaMarca}
          onSave={handleCrearMarca}
          onCancel={() => setShowMarcaModal(false)}
          loading={loadingMarca}
        />
      )}

      {showTipoModal && (
        <Modal
          title="Nuevo Tipo de Vehículo"
          value={nuevoTipo}
          onChange={setNuevoTipo}
          onSave={handleCrearTipo}
          onCancel={() => setShowTipoModal(false)}
          loading={loadingTipo}
        />
      )}

      {success && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn z-50">
          <div className="bg-[#1b3a3f] border border-[#2f6368] rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-scaleIn">
            <CheckCircle className="text-[#36b6b0] mb-3" size={60} />
            <h3 className="text-2xl font-bold mb-1">Vehículo creado con éxito</h3>
            <p className="text-[#a8d8d3]">Redirigiendo al listado...</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-dark {
          width: 100%;
          border-radius: 0.6rem;
          background-color: #1b3a3f;
          border: 1px solid #2f6368;
          padding: 0.55rem 0.75rem;
          color: #e8f9f9;
          outline: none;
          transition: all 0.2s ease-in-out;
        }
        .input-dark:focus {
          border-color: #36b6b0;
          box-shadow: 0 0 6px #36b6b055;
        }
        .btn-teal {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          background-color: #2ca6a4;
          color: white;
          padding: 0.55rem 0.9rem;
          border-radius: 0.6rem;
          transition: all 0.2s ease-in-out;
        }
        .btn-teal:hover {
          background-color: #249390;
        }
        .btn-outline {
          background-color: #2f6368;
          color: #e8f9f9;
          padding: 0.55rem 0.9rem;
          border-radius: 0.6rem;
          font-weight: 600;
          transition: all 0.2s ease-in-out;
        }
        .btn-outline:hover {
          background-color: #3b7b80;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.25s ease-out; }
      `}</style>
    </div>
  );
}

/* ---------- COMPONENTE FIELD ---------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#9ed1cd] tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ---------- COMPONENTE MODAL ---------- */
function Modal({
  title,
  value,
  onChange,
  onSave,
  onCancel,
  loading,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-[#0f2225] to-[#11292e] border border-[#1e3c42]/70 rounded-2xl p-6 w-[400px] shadow-2xl space-y-4">
        <h2 className="text-xl font-semibold text-[#e8f9f9]">{title}</h2>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ingrese el nombre..."
          className="input-dark w-full"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onCancel} className="btn-outline">Cancelar</button>
          <button
            onClick={onSave}
            disabled={loading}
            className="btn-teal"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
