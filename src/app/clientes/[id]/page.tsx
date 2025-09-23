// Archivo: final.tsx
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

// Componente para mostrar un adjunto
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
    <li className="py-3 flex items-center justify-between">
      <div className="text-sm">
        <div className="font-medium">{adjunto.nombre ?? "(sin nombre)"}</div>
        <div className="text-gray-600">
          {adjunto.tipo ?? "desconocido"}{" "}
          {typeof adjunto.tamanio === "number" ? `• ${Math.round(adjunto.tamanio / 1024)} KB` : ""}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1 rounded bg-gray-100 border border-gray-300 hover:bg-gray-200 text-sm"
        >
          Descargar
        </a>
        <button
          type="button"
          onClick={async () => {
            if (!confirm("¿Eliminar este adjunto?")) return;
            await onEliminar(adjunto._id);
          }}
          className="px-3 py-1 rounded bg-gray-100 border border-gray-300 hover:bg-gray-200 text-sm"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}

// Componente principal
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
  
  // ====== Estado Contratos ======
  const [cTitulo, setCTitulo] = useState("");
  const [cInicio, setCInicio] = useState("");
  const [cFin, setCFin] = useState("");
  const [cMonto, setCMonto] = useState("");
  const [cEstado, setCEstado] = useState("pendiente");
  const [cNotas, setCNotas] = useState("");
  const [cError, setCError] = useState("");
  const [cOk, setCOk] = useState("");
  
  // ====== Estado Interacciones ======
  const [iTipo, setITipo] = useState("llamada");
  const [iResumen, setIResumen] = useState("");
  const [iProx, setIProx] = useState("");
  const [iError, setIError] = useState("");
  const [iOk, setIOk] = useState("");

  // ====== Mutations y Actions ======
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

  // ====== Funciones utilitarias ======
  const fechasValidas = (ini: string, fin?: string) => {
    if (!ini) return false;
    const di = new Date(ini);
    if (Number.isNaN(+di)) return false;
    if (fin) {
      const df = new Date(fin);
      if (Number.isNaN(+df)) return false;
      if (df < di) return false;
    }
    return true;
  };

  const limpiarContrato = () => {
    setCIdEdit(null);
    setCTitulo("");
    setCInicio("");
    setCFin("");
    setCMonto("");
    setCEstado("pendiente");
    setCNotas("");
    setArchivos([]);
  };

  const cargarEdicionContrato = (c: any) => {
    setCIdEdit(c._id);
    setCTitulo(c.titulo);
    setCInicio(c.fechaInicio);
    setCFin(c.fechaFin ?? "");
    setCMonto(String(c.monto));
    setCEstado(c.estado);
    setCNotas(c.notas ?? "");
    setCOk("");
    setCError("");
    setArchivos([]);
  };

  const limpiarInteraccion = () => {
    setIIdEdit(null);
    setITipo("llamada");
    setIResumen("");
    setIProx("");
  };

  const cargarEdicionInteraccion = (i: any) => {
    setIIdEdit(i._id);
    setITipo(i.tipo);
    setIResumen(i.resumen);
    setIProx(i.proximaAccion ?? "");
    setIOk("");
    setIError("");
  };

  const subirYAgregarAdjuntos = async () => {
    if (!cIdEdit || archivos.length === 0) return;
  
    const permitidos = new Set([
      "application/pdf",
      "image/png", "image/jpeg", "image/gif", "image/webp", "image/bmp", "image/tiff", "image/svg+xml",
    ]);
  
    const elegibles = archivos.filter(f => {
      const tipo = (f.type || "").toLowerCase();
      const nombre = f.name.toLowerCase();
      const esPdf = tipo === "application/pdf" || nombre.endsWith(".pdf");
      const esImagen = tipo.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|bmp|tiff|svg)$/.test(nombre);
      return esPdf || esImagen || permitidos.has(tipo);
    });
  
    if (elegibles.length === 0) {
      alert("Solo se permiten imágenes y archivos PDF.");
      return;
    }
    if (elegibles.length !== archivos.length) {
      alert("Algunos archivos fueron omitidos por no ser imagen o PDF.");
    }
  
    const metas: Array<{ archivoId: string; nombre?: string; tipo?: string; tamanio?: number }> = [];
  
    for (const file of elegibles) {
      const uploadUrl = await obtenerUrlSubida({});
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      const json = await res.json();
      metas.push({
        archivoId: json.storageId as string,
        nombre: file.name,
        tipo: file.type,
        tamanio: file.size,
      });
    }
  
    await agregarAdjuntos({
      contratoId: cIdEdit as any,
      archivos: metas as any,
    });
  
    setArchivos([]);
  };

  // ====== Manejadores de formularios ======
  const guardarContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    setCError("");
    setCOk("");

    if (!cTitulo.trim()) return setCError("El título es obligatorio.");
    if (!cInicio) return setCError("La fecha de inicio es obligatoria.");
    if (!cMonto) return setCError("El monto es obligatorio.");
    if (!fechasValidas(cInicio, cFin || undefined)) {
      return setCError("Las fechas no son válidas (fin no puede ser anterior al inicio).");
    }
    const montoNum = Number(cMonto);
    if (Number.isNaN(montoNum) || montoNum < 0) {
      return setCError("El monto debe ser un número válido.");
    }

    try {
      if (cIdEdit) {
        const contratoOriginal = contratos.find((c: any) => c._id === cIdEdit);
        const montoOriginal = contratoOriginal?.monto ?? 0;
        await actualizarContrato({
          id: cIdEdit as any,
          titulo: cTitulo,
          fechaInicio: cInicio,
          fechaFin: cFin || undefined,
          monto: montoNum,
          estado: cEstado,
          notas: cNotas || undefined,
        });

        if (montoOriginal !== montoNum) {
          await registrarNota({
            clienteId: id as any,
            contratoId: cIdEdit,
            tipo: montoNum > montoOriginal ? "debito" : "credito",
            monto: Math.abs(montoNum - montoOriginal),
            motivo: "Ajuste por modificación del contrato",
          });
        }
        setCOk("Contrato actualizado con éxito.");
      } else {
        await crearContrato({
          clienteId: id as any,
          titulo: cTitulo,
          fechaInicio: cInicio,
          fechaFin: cFin || undefined,
          monto: montoNum,
          estado: cEstado,
          notas: cNotas || undefined,
        });
        setCOk("Contrato creado con éxito.");
      }
      limpiarContrato();
    } catch (err: any) {
      setCError(err?.message ?? "No se pudo guardar el contrato.");
    }
  };

  const guardarInteraccion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIError("");
    setIOk("");
    if (!iResumen.trim()) return setIError("La descripción es obligatoria.");
    try {
      if (iIdEdit) {
        await actualizarInteraccion({
          id: iIdEdit as any,
          tipo: iTipo,
          resumen: iResumen,
          proximaAccion: iProx || undefined,
        });
        setIOk("Interacción actualizada con éxito.");
      } else {
        await registrarInteraccion({
          clienteId: id as any,
          tipo: iTipo,
          resumen: iResumen,
          proximaAccion: iProx || undefined,
        });
        setIOk("Interacción registrada con éxito.");
      }
      limpiarInteraccion();
    } catch (err: any) {
      setIError(err?.message ?? "No se pudo guardar la interacción.");
    }
  };

  // ====== Renderizado ======
  if (!cliente) return <div className="p-6 text-white bg-black min-h-screen">Cargando…</div>;

  return (
    <div className="p-8 bg-black min-h-screen text-white space-y-10">
      {/* Encabezado */}
      <section className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{cliente.nombre}</h1>
            <div className="text-gray-300">
              {cliente.correo}
              {cliente.empresa ? ` • ${cliente.empresa}` : ""}
              {cliente.telefono ? ` • ${cliente.telefono}` : ""}
            </div>
            {cliente.notas && <p className="text-gray-400 whitespace-pre-wrap">{cliente.notas}</p>}
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!confirm("¿Eliminar este cliente y todo su contenido asociado? Esta acción no se puede deshacer.")) return;
              try {
                await eliminarCliente({ id: id as any });
                router.push("/clientes");
              } catch (e: any) {
                alert(e?.message ?? "No se pudo eliminar el cliente.");
              }
            }}
            className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
            title="Eliminar cliente"
          >
            Eliminar cliente
          </button>
        </div>
      </section>

      {/* Gestión de Contratos */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Gestión de contratos</h2>

        {/* Formulario contrato */}
        <form onSubmit={guardarContrato} className="grid gap-4 bg-white p-6 rounded-2xl shadow text-black">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input className="bg-white border border-gray-300 rounded px-3 py-2 text-black placeholder-gray-500"
                   placeholder="Título *" value={cTitulo} onChange={(e) => setCTitulo(e.target.value)} />
            <input className="bg-white border border-gray-300 rounded px-3 py-2 text-black"
                   type="date" value={cInicio} onChange={(e) => setCInicio(e.target.value)} />
            <input className="bg-white border border-gray-300 rounded px-3 py-2 text-black"
                   type="date" value={cFin} onChange={(e) => setCFin(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input className="bg-white border border-gray-300 rounded px-3 py-2 text-black placeholder-gray-500"
                   placeholder="Monto *" value={cMonto} onChange={(e) => setCMonto(e.target.value)} />
            <select className="bg-white border border-gray-300 rounded px-3 py-2 text-black"
                    value={cEstado} onChange={(e) => setCEstado(e.target.value)}>
              <option value="pendiente">pendiente</option>
              <option value="activo">activo</option>
              <option value="finalizado">finalizado</option>
              <option value="cancelado">cancelado</option>
            </select>
            <input className="bg-white border border-gray-300 rounded px-3 py-2 text-black placeholder-gray-500"
                   placeholder="Notas" value={cNotas} onChange={(e) => setCNotas(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded bg-black text-white font-semibold hover:bg-gray-800">
              {cIdEdit ? "Actualizar contrato" : "Agregar contrato"}
            </button>
            {cIdEdit && (
              <>
                <button type="button" onClick={limpiarContrato}
                        className="px-4 py-2 rounded bg-gray-200 text-black hover:bg-gray-300">
                  Cancelar edición
                </button>
                <button
                    type="button"
                    onClick={async () => {
                    if (!confirm("¿Eliminar este contrato? Esta acción no se puede deshacer.")) return;
                    await eliminarContrato({ id: cIdEdit as any });
                    limpiarContrato();
                    }}
                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                >
                    Eliminar contrato
                </button>
              </>
            )}
          </div>
          {cError && <p className="text-red-600 text-sm">{cError}</p>}
          {cOk && <p className="text-green-500 text-sm">{cOk}</p>}
        </form>

        {/* Adjuntos (solo en edición) */}
        {cIdEdit && (
          <div className="bg-white rounded-2xl shadow p-6 text-black space-y-4">
            <h3 className="text-lg font-semibold">Archivos adjuntos</h3>
            <div className="flex flex-wrap items-center gap-3">
              <input
                id="multi-archivos"
                type="file"
                className="hidden"
                multiple
                accept="image/*,.pdf,application/pdf"
                onChange={(e) => setArchivos(Array.from(e.target.files ?? []))}
              />
              <label htmlFor="multi-archivos" className="inline-flex items-center px-4 py-2 rounded bg-black text-white font-semibold hover:bg-gray-800 cursor-pointer">
                Seleccionar archivos
              </label>
              {archivos.length > 0 ? (
                <span className="text-sm text-gray-700">
                  {archivos.length} archivo(s) seleccionado(s)
                </span>
              ) : (
                <span className="text-sm text-gray-500">Ningún archivo seleccionado</span>
              )}
              <button
                type="button"
                onClick={subirYAgregarAdjuntos}
                className="px-4 py-2 rounded bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50"
                disabled={archivos.length === 0}
              >
                Subir archivos
              </button>
              {archivos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setArchivos([])}
                  className="px-3 py-2 rounded bg-gray-200 text-black hover:bg-gray-300"
                >
                  Limpiar selección
                </button>
              )}
            </div>
            <ul className="divide-y divide-gray-200">
              {adjuntos.map((a) => (
                <AdjuntoItem
                  key={a._id}
                  adjunto={a}
                  onEliminar={(id) => eliminarAdjunto({ adjuntoId: id as any })}
                />
              ))}
              {adjuntos.length === 0 && (
                <li className="py-3 text-gray-600">Sin archivos adjuntos</li>
              )}
            </ul>
          </div>
        )}

        {/* Historial del contrato (solo visible al editar) */}
        {cIdEdit && (
          <div className="bg-white rounded-2xl shadow p-6 text-black">
            <h3 className="text-lg font-semibold mb-3">Historial del contrato</h3>
            {historial.length === 0 ? (
              <p className="text-gray-600">Sin cambios registrados aún.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {historial.map((h: any) => (
                  <li key={h._id} className="py-3">
                    <div className="text-sm text-gray-600">
                      {new Date(h.cambiadoEn).toLocaleString()}
                      {h.tipoCambio ? ` • ${h.tipoCambio}` : ""}
                    </div>
                    {(h.estadoAnterior || h.montoAnterior || h.fechaInicioAnterior || h.fechaFinAnterior || h.notasAnteriores) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-1">
                        {h.estadoAnterior && <div><span className="font-medium">Estado anterior:</span> {h.estadoAnterior}</div>}
                        {typeof h.montoAnterior === "number" && (
                          <div><span className="font-medium">Monto anterior:</span> ${h.montoAnterior?.toLocaleString?.() ?? h.montoAnterior}</div>
                        )}
                        {h.fechaInicioAnterior && <div><span className="font-medium">Inicio anterior:</span> {h.fechaInicioAnterior}</div>}
                        {h.fechaFinAnterior && <div><span className="font-medium">Fin anterior:</span> {h.fechaFinAnterior}</div>}
                        {h.notasAnteriores && (
                          <div className="md:col-span-2"><span className="font-medium">Notas anteriores:</span> {h.notasAnteriores}</div>
                        )}
                      </div>
                    )}
                    {h.adjuntosAnteriores && h.adjuntosAnteriores.length > 0 && (
                      <div className="text-sm mt-2">
                        <div className="font-medium mb-1">Adjuntos anteriores ({h.adjuntosAnteriores.length}):</div>
                        <ul className="list-disc ml-5 space-y-1">
                          {h.adjuntosAnteriores.map((a: any, idx: number) => (
                            <li key={idx} className="text-gray-700">
                              {a.nombre ?? "(sin nombre)"}{" "}
                              {typeof a.tamanio === "number" ? `— ${Math.round(a.tamanio / 1024)} KB` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Lista de contratos */}
        <h3 className="text-lg font-semibold mb-3">Contratos</h3>
        <ul className="divide-y divide-gray-200 bg-white rounded-2xl shadow text-black">
          {contratos.map((c: any) => (
            <li key={c._id} className="py-4 px-6 flex items-start justify-between">
              <div>
                <div className="font-semibold">{c.titulo} — {c.estado}</div>
                <div className="text-gray-600 text-sm">
                  {c.fechaInicio}{c.fechaFin ? ` → ${c.fechaFin}` : ""} • ${c.monto.toLocaleString()}
                </div>
                {c.notas && <p className="text-gray-700">{c.notas}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded bg-gray-100 border border-gray-300 hover:bg-gray-200"
                  onClick={() => cargarEdicionContrato(c)}
                >
                  Editar
                </button>
              </div>
            </li>
          ))}
          {contratos.length === 0 && <li className="py-4 px-6 text-gray-500">Sin contratos</li>}
        </ul>
      </section>
      
      {/* Notas financieras */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Notas de Crédito / Débito</h2>
        {notasFinancieras.length === 0 ? (
          <p className="text-gray-400">No hay notas registradas</p>
        ) : (
          <ul className="space-y-2 bg-white rounded-2xl shadow p-6 text-black">
            {notasFinancieras.map((n: any) => (
              <li key={n._id} className="py-3 flex justify-between">
                <div>
                  <div className="font-semibold">{n.tipo === 'credito' ? 'Nota de Crédito' : 'Nota de Débito'}</div>
                  <div className="text-sm">{new Date(n.generadoEn).toLocaleDateString()} — {n.motivo}</div>
                </div>
                <div className={n.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}>
                  ${n.monto.toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Seguimiento de Interacciones */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Seguimiento de interacciones</h2>
        <form onSubmit={guardarInteraccion} className="grid gap-4 bg-white p-6 rounded-2xl shadow max-w-2xl text-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select className="bg-white border border-gray-300 rounded px-3 py-2 text-black"
                    value={iTipo} onChange={(e) => setITipo(e.target.value)}>
              <option value="llamada">Llamada</option>
              <option value="correo">Correo</option>
              <option value="reunión">Reunión</option>
              <option value="ticket">Ticket</option>
            </select>
            <input className="bg-white border border-gray-300 rounded px-3 py-2 text-black"
                   type="date" value={iProx} onChange={(e) => setIProx(e.target.value)} />
          </div>
          <textarea className="bg-white border border-gray-300 rounded px-3 py-2 text-black placeholder-gray-500"
                    rows={3} placeholder="Resumen de la interacción (obligatorio)"
                    value={iResumen} onChange={(e) => setIResumen(e.target.value)} />
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded bg-black text-white font-semibold hover:bg-gray-800">
              {iIdEdit ? "Actualizar interacción" : "Guardar seguimiento"}
            </button>
            {iIdEdit && (
              <button type="button" onClick={limpiarInteraccion}
                      className="px-4 py-2 rounded bg-gray-200 text-black hover:bg-gray-300">
                Cancelar edición
              </button>
            )}
          </div>
          {iError && <p className="text-red-600 text-sm">{iError}</p>}
          {iOk && <p className="text-green-500 text-sm">{iOk}</p>}
        </form>

        <ul className="divide-y divide-gray-200 bg-white rounded-2xl shadow text-black">
          {interacciones.map((i: any) => (
            <li key={i._id} className="py-4 px-6 flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-600">
                  {new Date(i.creadoEn).toLocaleString()} • {i.tipo}
                </div>
                <div className="text-black">{i.resumen}</div>
                {i.proximaAccion && <div className="text-xs text-gray-600">Fecha de interacción: {i.proximaAccion}</div>}
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded bg-gray-100 border border-gray-300 hover:bg-gray-200"
                  onClick={() => cargarEdicionInteraccion(i)}
                >
                  Editar
                </button>
              </div>
            </li>
          ))}
          {interacciones.length === 0 && <li className="py-4 px-6 text-gray-500">Sin actividades</li>}
        </ul>
      </section>
    </div>
  );
}