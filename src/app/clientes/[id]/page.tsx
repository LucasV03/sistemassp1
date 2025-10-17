"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from '../../../../convex/_generated/api';
import { useState } from "react";

type Adjunto = {
  _id: string;
  archivoId: string;
  nombre?: string;
  tipo?: string;
  tamanio?: number;
  subidoEn: number;
  contratoId: string;
};

// 🔹 Item de archivo adjunto
function AdjuntoItem({
  adjunto,
  onEliminar,
}: {
  adjunto: Adjunto;
  onEliminar: (id: string) => Promise<void>;
}) {
  const url =
    useQuery(api.contratos.urlArchivo, { archivoId: adjunto.archivoId } as any) ?? null;

  return (
    <li className="py-3 flex items-center justify-between border-b border-[#2f6368]">
      <div className="text-sm text-[#e8f9f9]">
        <div className="font-medium">{adjunto.nombre ?? "(sin nombre)"}</div>
        <div className="text-[#a8d8d3] text-xs">
          {adjunto.tipo ?? "desconocido"}{" "}
          {typeof adjunto.tamanio === "number" ? `• ${Math.round(adjunto.tamanio / 1024)} KB` : ""}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1 rounded bg-[#2ca6a4] text-white text-sm font-semibold hover:bg-[#249390]"
        >
          Descargar
        </a>
        <button
          type="button"
          onClick={async () => {
            if (!confirm("¿Eliminar este adjunto?")) return;
            await onEliminar(adjunto._id);
          }}
          className="px-3 py-1 rounded bg-[#ff5c5c33] text-[#ff5c5c] border border-[#ff5c5c66] text-sm hover:bg-[#ff5c5c55]"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}

// 🔹 Página principal
export default function DetalleCliente() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // ====== Queries ======
  const cliente = useQuery(api.clientes.obtener, { id: id as any });
  const contratos = useQuery(api.contratos.contratosPorCliente, { clienteId: id as any }) ?? [];
  const notasFinancieras = useQuery(api.notasFinancieras.porCliente, { clienteId: id as any }) ?? [];
  const interacciones = useQuery(api.interacciones.interaccionesPorCliente, { clienteId: id as any }) ?? [];

  const [cIdEdit, setCIdEdit] = useState<string | null>(null);
  const [iIdEdit, setIIdEdit] = useState<string | null>(null);
  const [archivos, setArchivos] = useState<File[]>([]);

  // ====== Estados contrato ======
  const [cTitulo, setCTitulo] = useState("");
  const [cInicio, setCInicio] = useState("");
  const [cFin, setCFin] = useState("");
  const [cMonto, setCMonto] = useState("");
  const [cEstado, setCEstado] = useState("pendiente");
  const [cNotas, setCNotas] = useState("");
  const [cError, setCError] = useState("");
  const [cOk, setCOk] = useState("");

  // ====== Estados interacción ======
  const [iTipo, setITipo] = useState("llamada");
  const [iResumen, setIResumen] = useState("");
  const [iProx, setIProx] = useState("");
  const [iError, setIError] = useState("");
  const [iOk, setIOk] = useState("");

  // ====== Mutations ======
  const crearContrato = useMutation(api.contratos.crearContrato);
  const actualizarContrato = useMutation(api.contratos.actualizarContrato);
  const eliminarContrato = useMutation(api.contratos.eliminarContrato);
  const registrarNota = useMutation(api.notasFinancieras.registrar);
  const registrarInteraccion = useMutation(api.interacciones.registrarInteraccion);
  const actualizarInteraccion = useMutation(api.interacciones.actualizarInteraccion);
  const obtenerUrlSubida = useAction(api.contratos.obtenerUrlSubida);
  const eliminarAdjunto = useMutation(api.contratos.eliminarAdjunto);
  const agregarAdjuntos = useMutation(api.contratos.agregarAdjuntos);
  const eliminarCliente = useMutation(api.clientes.eliminarCliente);

  // ====== Queries condicionales ======
  const historial =
    useQuery(
      api.contratos.historialPorContrato,
      cIdEdit ? ({ contratoId: cIdEdit as any } as any) : ("skip" as any)
    ) ?? [];
  const adjuntos: Adjunto[] =
    useQuery(
      api.contratos.adjuntosPorContrato,
      cIdEdit ? ({ contratoId: cIdEdit as any } as any) : ("skip" as any)
    ) ?? [];

  // ====== Renderizado ======
  if (!cliente)
    return (
      <div className="min-h-screen bg-[#1b3a3f] text-[#e8f9f9] flex items-center justify-center">
        Cargando información del cliente...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#1b3a3f] text-[#e8f9f9] p-8 space-y-10">
      {/* 🔹 Encabezado */}
      <section className="flex items-start justify-between border-b border-[#2f6368] pb-4">
        <div>
          <h1 className="text-3xl font-bold">{cliente.nombre}</h1>
          <p className="text-[#a8d8d3]">
            {cliente.correo}
            {cliente.empresa ? ` • ${cliente.empresa}` : ""}
            {cliente.telefono ? ` • ${cliente.telefono}` : ""}
          </p>
          {cliente.notas && <p className="text-[#b7e2de] mt-1">{cliente.notas}</p>}
        </div>
        <button
          onClick={async () => {
            if (!confirm("¿Eliminar este cliente y su información?")) return;
            await eliminarCliente({ id: id as any });
            router.push("/clientes");
          }}
          className="px-4 py-2 rounded bg-[#ff5c5c] text-white font-semibold hover:bg-[#e24e4e]"
        >
          Eliminar cliente
        </button>
      </section>

      {/* 🔹 Gestión de contratos */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Gestión de contratos</h2>

        {/* Formulario de contrato */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="bg-[#24474d] rounded-xl p-6 shadow-md space-y-4 border border-[#2f6368]"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              className="bg-[#1b3a3f] border border-[#2f6368] rounded px-3 py-2 text-[#e8f9f9] placeholder-gray-400"
              placeholder="Título *"
              value={cTitulo}
              onChange={(e) => setCTitulo(e.target.value)}
            />
            <input
              type="date"
              className="bg-[#1b3a3f] border border-[#2f6368] rounded px-3 py-2 text-[#e8f9f9]"
              value={cInicio}
              onChange={(e) => setCInicio(e.target.value)}
            />
            <input
              type="date"
              className="bg-[#1b3a3f] border border-[#2f6368] rounded px-3 py-2 text-[#e8f9f9]"
              value={cFin}
              onChange={(e) => setCFin(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              className="bg-[#1b3a3f] border border-[#2f6368] rounded px-3 py-2 text-[#e8f9f9]"
              placeholder="Monto *"
              value={cMonto}
              onChange={(e) => setCMonto(e.target.value)}
            />
            <select
              className="bg-[#1b3a3f] border border-[#2f6368] rounded px-3 py-2 text-[#e8f9f9]"
              value={cEstado}
              onChange={(e) => setCEstado(e.target.value)}
            >
              <option value="pendiente">Pendiente</option>
              <option value="activo">Activo</option>
              <option value="finalizado">Finalizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <input
              className="bg-[#1b3a3f] border border-[#2f6368] rounded px-3 py-2 text-[#e8f9f9]"
              placeholder="Notas"
              value={cNotas}
              onChange={(e) => setCNotas(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button className="px-4 py-2 rounded bg-[#2ca6a4] text-white font-semibold hover:bg-[#249390]">
              {cIdEdit ? "Actualizar" : "Agregar contrato"}
            </button>
            {cIdEdit && (
              <button
                type="button"
                onClick={() => setCIdEdit(null)}
                className="px-4 py-2 rounded bg-[#b7d9d7] text-[#1b3a3f] font-semibold hover:bg-[#a0c8c5]"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Lista de contratos */}
        <ul className="divide-y divide-[#2f6368] bg-[#24474d] rounded-xl border border-[#2f6368]">
          {contratos.map((c: any) => (
            <li key={c._id} className="p-4 flex items-start justify-between hover:bg-[#2b5a60] transition">
              <div>
                <div className="font-semibold text-[#e8f9f9]">
                  {c.titulo} — {c.estado}
                </div>
                <div className="text-[#a8d8d3] text-sm">
                  {c.fechaInicio}
                  {c.fechaFin ? ` → ${c.fechaFin}` : ""} • ${c.monto.toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setCIdEdit(c._id)}
                className="px-3 py-1 rounded bg-[#2ca6a4] text-white text-sm hover:bg-[#249390]"
              >
                Editar
              </button>
            </li>
          ))}
          {contratos.length === 0 && (
            <li className="p-4 text-[#b7e2de]">Sin contratos registrados.</li>
          )}
        </ul>
      </section>

      {/* 🔹 Interacciones */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Seguimiento de interacciones</h2>
        <form className="bg-[#24474d] p-6 rounded-xl border border-[#2f6368] shadow space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              className="bg-[#1b3a3f] border border-[#2f6368] rounded px-3 py-2 text-[#e8f9f9]"
              value={iTipo}
              onChange={(e) => setITipo(e.target.value)}
            >
              <option value="llamada">Llamada</option>
              <option value="correo">Correo</option>
              <option value="reunión">Reunión</option>
              <option value="ticket">Ticket</option>
            </select>
            <input
              type="date"
              className="bg-[#1b3a3f] border border-[#2f6368] rounded px-3 py-2 text-[#e8f9f9]"
              value={iProx}
              onChange={(e) => setIProx(e.target.value)}
            />
          </div>
          <textarea
            className="bg-[#1b3a3f] border border-[#2f6368] rounded px-3 py-2 text-[#e8f9f9] placeholder-gray-400"
            rows={3}
            placeholder="Resumen de la interacción"
            value={iResumen}
            onChange={(e) => setIResumen(e.target.value)}
          />
          <button className="px-4 py-2 rounded bg-[#2ca6a4] text-white font-semibold hover:bg-[#249390]">
            {iIdEdit ? "Actualizar" : "Guardar"}
          </button>
        </form>
      </section>
    </div>
  );
}
