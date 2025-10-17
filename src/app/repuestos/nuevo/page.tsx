"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

// Selectores asíncronos
import SelectCategoria from "@/components/selectores/SelectCategoria";
import SelectMarca from "@/components/selectores/SelectMarca";
import SelectVehiculo from "@/components/selectores/SelectVehiculo";
import SelectModelo from "@/components/selectores/SelectModelo";

export default function NuevoRepuestoPage() {
  const router = useRouter();
  const crearRepuesto = useMutation(api.repuestos.crear);

  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    precioUnitario: 0,
    marca: "",
    modeloCompatible: "",
    categoria: "",
    vehiculo: "",
  });

  // ids opcionales
  const [marcaId, setMarcaId] = useState<string | undefined>(undefined);
  const [vehiculoId, setVehiculoId] = useState<string | undefined>(undefined);
  const [categoriaId, setCategoriaId] = useState<string | undefined>(undefined);
  const [modeloId, setModeloId] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "precioUnitario" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo.trim() || !form.nombre.trim()) {
      alert("Código y nombre son obligatorios");
      return;
    }
    setLoading(true);
    try {
      await crearRepuesto(form);
      alert("Repuesto creado ✅");
      router.push("/repuestos");
    } catch (err) {
      console.error(err);
      alert("❌ Error al crear repuesto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#1b3a3f] text-[#e6f6f7] p-6">
      <article className="max-w-3xl mx-auto bg-[#24474d] rounded-xl border border-[#2f6368] p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-6">➕ Nuevo Repuesto</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-5">
            <Field label="Código">
              <Input
                name="codigo"
                value={form.codigo}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Nombre">
              <Input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Descripción" className="flex-1 min-w-[260px]">
              <Textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows={3}
              />
            </Field>

            {/* Selectores asíncronos */}
            <SelectCategoria
              valueName={form.categoria}
              onPick={(nombre, id) => {
                setForm((p) => ({ ...p, categoria: nombre }));
                setCategoriaId(id);
              }}
            />
            <SelectMarca
              valueName={form.marca}
              onPick={(nombre, id) => {
                setForm((p) => ({ ...p, marca: nombre }));
                setMarcaId(id);
                setForm((p) => ({ ...p, vehiculo: "", modeloCompatible: "" }));
                setVehiculoId(undefined);
                setModeloId(undefined);
              }}
            />
            <SelectVehiculo
              valueName={form.vehiculo}
              marcaId={marcaId ?? null}
              onPick={(nombre, id) => {
                setForm((p) => ({ ...p, vehiculo: nombre }));
                setVehiculoId(id);
                setForm((p) => ({ ...p, modeloCompatible: "" }));
                setModeloId(undefined);
              }}
            />
            <SelectModelo
              valueName={form.modeloCompatible}
              marcaId={marcaId ?? null}
              vehiculoId={vehiculoId ?? null}
              onPick={(nombre, id) => {
                setForm((p) => ({ ...p, modeloCompatible: nombre }));
                setModeloId(id);
              }}
            />

            
          </div>

          {/* Botonera */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg border border-[#2f6368] bg-[#2b5a60] hover:bg-[#2f6368] text-[#e6f6f7]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-lg text-white font-semibold shadow transition ${
                loading ? "bg-gray-400" : "bg-[#2ca6a4] hover:bg-[#249390]"
              }`}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </article>
    </main>
  );
}

/* ---------- Helpers ---------- */

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col flex-1 min-w-[220px] ${className}`}>
      <label className="text-sm font-medium text-[#b7e2de] mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  type = "text",
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      {...props}
      className={[
        "border border-[#2c5a60]",
        "bg-[#24474d]",
        "text-gray-100",
        "placeholder-gray-400",
        "caret-current",
        "rounded-lg px-3 py-2 w-full text-sm shadow-sm",
        "focus:ring-2 focus:ring-[#36b6b0] focus:outline-none",
        className,
      ].join(" ")}
    />
  );
}

function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "border border-[#2c5a60]",
        "bg-[#24474d]",
        "text-gray-100",
        "placeholder-gray-400",
        "caret-current",
        "rounded-lg px-3 py-2 w-full text-sm shadow-sm",
        "focus:ring-2 focus:ring-[#36b6b0] focus:outline-none",
        "resize-y",
        className,
      ].join(" ")}
    />
  );
}
