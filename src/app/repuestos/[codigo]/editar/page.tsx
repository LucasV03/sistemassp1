"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";

// Selectores asíncronos
import SelectCategoria from "@/components/selectores/SelectCategoria";
import SelectMarca from "@/components/selectores/SelectMarca";
import SelectVehiculo from "@/components/selectores/SelectVehiculo";
import SelectModelo from "@/components/selectores/SelectModelo";

export default function EditarRepuestoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const router = useRouter();
  const { codigo } = use(params); // unwrap Promise (app router)
  const repuesto = useQuery(api.repuestos.obtenerPorCodigo, { codigo });

  const actualizarRepuestoPorCodigo = useMutation(api.repuestos.actualizarPorCodigo);

  // Estado del form (strings compatibles con tu API)
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    
    marca: "",
    modeloCompatible: "",
    categoria: "",
    vehiculo: "",
  });

  // ids para filtros dependientes
  const [marcaId, setMarcaId] = useState<string | undefined>(undefined);
  const [vehiculoId, setVehiculoId] = useState<string | undefined>(undefined);
  const [categoriaId, setCategoriaId] = useState<string | undefined>(undefined);
  const [modeloId, setModeloId] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(false);

  // Cargar datos al montar / actualizar query
  useEffect(() => {
    if (repuesto) {
      setForm({
        nombre: repuesto.nombre ?? "",
        descripcion: repuesto.descripcion ?? "",
        
        marca: repuesto.marca ?? "",
        modeloCompatible: repuesto.modeloCompatible ?? "",
        categoria: repuesto.categoria ?? "",
        vehiculo: repuesto.vehiculo ?? "",
      });
      // si ya guardás ids en el doc, podés precargar:
      setMarcaId(repuesto.marcaId);
      setVehiculoId(repuesto.vehiculoId);
      setCategoriaId(repuesto.categoriaId);
      setModeloId(repuesto.modeloId);
    }
  }, [repuesto]);

  // Handlers
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
    if (!form.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }
    setLoading(true);
    try {
      await actualizarRepuestoPorCodigo({ codigo, ...form });
      alert("Repuesto actualizado ✅");
      router.push("/repuestos");
    } catch (err) {
      console.error(err);
      alert("❌ Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  // Estados de carga
  if (repuesto === undefined)
    return (
      <main className="p-6 max-w-3xl mx-auto">
        <div className="h-32 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      </main>
    );
  if (repuesto === null)
    return (
      <main className="p-6 max-w-3xl mx-auto">
        <p className="text-rose-600 dark:text-rose-400">
          No se encontró el repuesto.
        </p>
      </main>
    );

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <article className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm bg-white dark:bg-neutral-900 hover:shadow-md transition">
        <h1 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">
          ✏️ Editar repuesto
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-5">
            <Field label="Código">
              <Input value={codigo} disabled />
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
              className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-lg text-white font-semibold shadow transition ${
                loading ? "bg-gray-400" : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              {loading ? "Guardando..." : "Guardar cambios"}
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
      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
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
        "border border-neutral-300 dark:border-neutral-700",
        "bg-white dark:bg-neutral-900",
        "text-neutral-900 dark:text-neutral-100",
        "placeholder-neutral-400 dark:placeholder-neutral-500",
        "caret-current",
        "rounded-lg px-3 py-2 w-full text-sm shadow-sm",
        "focus:ring-2 focus:ring-slate-500 focus:outline-none",
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
        "border border-neutral-300 dark:border-neutral-700",
        "bg-white dark:bg-neutral-900",
        "text-neutral-900 dark:text-neutral-100",
        "placeholder-neutral-400 dark:placeholder-neutral-500",
        "caret-current",
        "rounded-lg px-3 py-2 w-full text-sm shadow-sm",
        "focus:ring-2 focus:ring-slate-500 focus:outline-none",
        "resize-y",
        className,
      ].join(" ")}
    />
  );
}
