"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  Pencil,
  Save,
  CheckCircle2,
  Loader2,
  Plus,
  AlertTriangle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function TarifasVehiculosTable() {
  // 🔹 Datos desde Convex
  const tarifas = useQuery(api.tarifas_vehiculos.listar) ?? [];
  const tipos = useQuery(api.tipos_vehiculo.listar) ?? [];

  const crear = useMutation(api.tarifas_vehiculos.crear);
  const actualizar = useMutation(api.tarifas_vehiculos.actualizar);

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [nuevoPrecio, setNuevoPrecio] = useState<number | "">("");
  const [nuevoTipo, setNuevoTipo] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [savedRow, setSavedRow] = useState<number | null>(null);

  // 🟢 Vincular tarifas con nombres de tipo de vehículo
  const tarifasConNombres = tarifas.map((t: any) => {
    const tipo = tipos.find((tv: any) => tv._id === t.tipoVehiculoId);
    return {
      ...t,
      tipoVehiculoNombre: tipo?.nombre ?? "Sin tipo asignado",
    };
  });

  /* 🧩 Guardar actualización */
  const handleGuardar = async (id: Id<"tarifas_vehiculos">, idx: number) => {
    if (nuevoPrecio === "" || isNaN(Number(nuevoPrecio))) {
      toast.error("Ingresá un valor numérico válido.");
      return;
    }

    setSaving(true);
    try {
      await actualizar({ id, precioKm: Number(nuevoPrecio) });
      toast.success("✅ Tarifa actualizada correctamente");
      setEditIndex(null);
      setNuevoPrecio("");
      setSavedRow(idx);
      setTimeout(() => setSavedRow(null), 2000);
    } catch {
      toast.error("❌ Error al actualizar la tarifa.");
    } finally {
      setSaving(false);
    }
  };

  /* ➕ Crear nueva tarifa */
  const handleCrear = async () => {
    if (!nuevoTipo || !nuevoPrecio) {
      toast.error("Seleccioná un tipo y un precio válido.");
      return;
    }

    const yaExiste = tarifas.some(
      (t: any) => String(t.tipoVehiculoId) === nuevoTipo
    );
    if (yaExiste) {
      toast.error("Ya existe una tarifa para este tipo de vehículo.");
      return;
    }

    setSaving(true);
    try {
      await crear({
        tipoVehiculoId: nuevoTipo as Id<"tipos_vehiculo">,
        precioKm: Number(nuevoPrecio),
      });
      toast.success("💲 Nueva tarifa creada correctamente");
      setNuevoTipo("");
      setNuevoPrecio("");
    } catch {
      toast.error("❌ Error al crear la tarifa.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#11292e] border border-[#1e3c42] rounded-2xl p-6 shadow-lg mt-10 transition-all duration-200">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1b3a3f", color: "#e8f9f9" },
        }}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-semibold text-[#e8f9f9] flex items-center gap-2">
          💲 Tarifas por Tipo de Vehículo
        </h2>
        <p className="text-[#7ca6a8] text-sm">
          Gestioná los valores por kilómetro según el tipo de vehículo.
        </p>
      </div>

      {/* NUEVA TARIFA */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={nuevoTipo}
          onChange={(e) => setNuevoTipo(e.target.value)}
          disabled={saving}
          className="bg-[#0f2327] border border-[#23454e] text-gray-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#36b6b0] disabled:opacity-60"
        >
          <option value="">Seleccionar tipo...</option>
          {tipos.map((t: any) => (
            <option key={t._id} value={t._id}>
              {t.nombre}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Precio por Km"
          value={nuevoPrecio}
          onChange={(e) => setNuevoPrecio(Number(e.target.value) || "")}
          disabled={saving}
          className="w-40 text-right rounded-md border border-[#23454e] bg-[#0f2327] text-gray-200 px-3 py-2 focus:ring-2 focus:ring-[#36b6b0] disabled:opacity-60"
        />

        <button
          onClick={handleCrear}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-semibold disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
          Agregar Tarifa
        </button>
      </div>

      {/* TABLA */}
      {tarifasConNombres.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-[#1e3c42]">
          <table className="w-full text-sm">
            <thead className="bg-[#0e2529] text-[#9ed1cd]">
              <tr>
                <th className="p-3 text-left font-medium">Tipo de Vehículo</th>
                <th className="p-3 text-right font-medium">Precio por Km</th>
                <th className="p-3 text-center font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {tarifasConNombres.map((t: any, idx: number) => {
                const estaEditando = editIndex === idx;
                const fueGuardado = savedRow === idx;

                return (
                  <tr
                    key={t._id}
                    className={`border-t border-[#1e3c42] transition-all duration-300 ${
                      fueGuardado
                        ? "bg-emerald-900/20 animate-pulse"
                        : "hover:bg-[#15393f]/40"
                    }`}
                  >
                    <td className="p-3 font-medium text-[#e8f9f9]">
                      {t.tipoVehiculoNombre}
                    </td>
                    <td className="p-3 text-right text-[#e8f9f9]">
                      {estaEditando ? (
                        <input
                          type="number"
                          value={nuevoPrecio}
                          onChange={(e) =>
                            setNuevoPrecio(Number(e.target.value) || "")
                          }
                          className="w-28 text-right rounded-md border border-[#23454e] bg-[#0f2327] text-gray-100 px-2 py-1 focus:ring-2 focus:ring-[#36b6b0]"
                          autoFocus
                        />
                      ) : (
                        t.precioKm.toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                        })
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {estaEditando ? (
                        <button
                          onClick={() => handleGuardar(t._id, idx)}
                          disabled={saving}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded bg-[#36b6b0] hover:bg-[#2ca6a4] text-white font-semibold disabled:opacity-60 transition-all"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="animate-spin" size={14} />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save size={14} /> Guardar
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditIndex(idx);
                            setNuevoPrecio(t.precioKm);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded bg-[#1e3c42] hover:bg-[#2e5d65] text-gray-200 font-semibold transition"
                        >
                          <Pencil size={14} /> Editar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center text-[#9ed1cd]/80">
          <AlertTriangle size={40} className="text-[#36b6b0] mb-3" />
          <p className="text-lg font-medium mb-1">
            Aún no hay tarifas registradas
          </p>
          <p className="text-sm text-[#7ca6a8]">
            Agregá una nueva tarifa seleccionando un tipo de vehículo y precio.
          </p>
        </div>
      )}
    </div>
  );
}
