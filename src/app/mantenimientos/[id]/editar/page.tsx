"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function EditarMantenimientoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // 🩹 se agrega {} como segundo argumento
  const mantenimientos = useQuery(api.mantenimientos.listar, {}) ?? [];
  const actual = mantenimientos.find((m: any) => m._id === id);

  const vehiculos = useQuery(api.vehiculos.listar, {}) ?? [];
  const actualizar = useMutation(api.mantenimientos.actualizar);

  // ✅ costo acepta string o number (permite cálculos posteriores)
  const [form, setForm] = useState<{
    vehiculoId: string;
    tipo: string;
    fecha: string;
    costo: string | number;
    descripcion: string;
    estado: string;
  }>({
    vehiculoId: "",
    tipo: "",
    fecha: "",
    costo: "",
    descripcion: "",
    estado: "PENDIENTE",
  });

  useEffect(() => {
    if (actual) {
      setForm({
        vehiculoId: actual.vehiculoId,
        tipo: actual.tipo,
        fecha: String(actual.fecha).split("T")[0],
        costo: actual.costo ?? "", // puede ser number o vacío
        descripcion: actual.descripcion ?? "",
        estado: actual.estado,
      });
    }
  }, [actual]);

  if (!actual)
    return (
      <div className="min-h-screen bg-[#0d1b1e] text-[#e8f8f8] flex items-center justify-center">
        Cargando mantenimiento...
      </div>
    );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await actualizar({
      id: actual._id,
      tipo: form.tipo,
      fecha: form.fecha,
      costo: form.costo ? Number(form.costo) : undefined, // ✅ envío numérico
      descripcion: form.descripcion,
      estado: form.estado as any,
    });
    alert("✅ Mantenimiento actualizado correctamente");
    router.push("/mantenimientos");
  };

  return (
    <div className="min-h-screen bg-[#0d1b1e] text-[#e8f8f8] p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/mantenimientos"
          className="flex items-center gap-2 text-[#36b6b0] hover:text-[#2ca6a4]"
        >
          <ArrowLeft size={18} />
          Volver
        </Link>
        <h1 className="text-2xl font-bold">Editar Mantenimiento</h1>
      </div>

      {/* FORMULARIO */}
      <form
        onSubmit={onSubmit}
        className="bg-[#11292e] border border-[#1e3c42] rounded-2xl p-8 shadow-lg max-w-2xl mx-auto space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Vehículo">
            <select
              value={form.vehiculoId}
              onChange={(e) => setForm({ ...form, vehiculoId: e.target.value })}
              className="bg-[#0e2529] text-white rounded-lg p-2 w-full"
              disabled
            >
              <option value="">{actual.vehiculoNombre}</option>
            </select>
          </Field>

          <Field label="Tipo">
            <input
              type="text"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="bg-[#0e2529] text-white rounded-lg p-2 w-full"
            />
          </Field>

          <Field label="Fecha">
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className="bg-[#0e2529] text-white rounded-lg p-2 w-full"
            />
          </Field>

          <Field label="Costo">
            <input
              type="number"
              value={form.costo}
              onChange={(e) => setForm({ ...form, costo: e.target.value })}
              className="bg-[#0e2529] text-white rounded-lg p-2 w-full"
              placeholder="Ej: 45000"
            />
          </Field>
        </div>

        <Field label="Descripción">
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="bg-[#0e2529] text-white rounded-lg p-2 w-full h-28 resize-none"
            placeholder="Detalle del trabajo realizado..."
          />
        </Field>

        <Field label="Estado">
          <select
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value })}
            className="bg-[#0e2529] text-white rounded-lg p-2 w-full"
          >
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_CURSO">En curso</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>
        </Field>

        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2 bg-[#36b6b0] hover:bg-[#2ca6a4] text-white rounded-lg font-semibold transition"
        >
          <Save size={18} />
          Guardar Cambios
        </button>
      </form>
    </div>
  );
}

/* ---------- COMPONENTE REUTILIZABLE ---------- */
function Field({ label, children }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-[#9ed1cd]">{label}</label>
      {children}
    </div>
  );
}
