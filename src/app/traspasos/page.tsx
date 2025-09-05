"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";

export default function TraspasosPage() {
  const traspasos = useQuery(api.traspasos.listarTraspasos);
  const confirmarTraspaso = useMutation(api.traspasos.confirmarTraspaso);

  // ✅ Traer lista de depósitos
  const depositos = useQuery(api.depositos.listar); 

  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [origenFiltro, setOrigenFiltro] = useState("todos");
  const [destinoFiltro, setDestinoFiltro] = useState("todos");
  const [diasFiltro, setDiasFiltro] = useState(0);

  // 👇 Manejar datos nulos sin cortar hooks
  const filtrados = useMemo(() => {
    if (!traspasos) return [];
    let lista = [...traspasos];

    if (estadoFiltro !== "todos") {
      lista = lista.filter((t) => t.estado === estadoFiltro);
    }
    if (origenFiltro !== "todos") {
      lista = lista.filter((t) => t.origenId === origenFiltro);
    }
    if (destinoFiltro !== "todos") {
      lista = lista.filter((t) => t.destinoId === destinoFiltro);
    }
    if (diasFiltro > 0) {
      const limite = new Date();
      limite.setDate(limite.getDate() - diasFiltro);
      lista = lista.filter((t) => new Date(t.fecha) >= limite);
    }
    return lista;
  }, [traspasos, estadoFiltro, origenFiltro, destinoFiltro, diasFiltro]);

  if (!traspasos || !depositos) {
    return <div className="p-6 text-white">Cargando...</div>;
  }
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">📦 Traspasos</h1>
      <a href="/traspasos/nuevo">
        <Button className="text-white bg-indigo-700 mb-3">
          ➕ Nuevo Traspaso
        </Button>
      </a>

      {/* Controles de filtro */}
      <div className="flex flex-wrap gap-3 items-center text-sm text-zinc-300">
        {/* Estado */}
        <div>
          <label className="mr-2">Estado:</label>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="bg-zinc-700 text-white p-1 rounded"
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="confirmado">Confirmados</option>
          </select>
        </div>

        {/* Origen */}
        <div>
          <label className="mr-2">Origen:</label>
          <select
            value={origenFiltro}
            onChange={(e) => setOrigenFiltro(e.target.value)}
            className="bg-zinc-700 text-white p-1 rounded"
          >
            <option value="todos">Todos</option>
            {depositos.map((d) => (
              <option key={d._id} value={d._id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Destino */}
        <div>
          <label className="mr-2">Destino:</label>
          <select
            value={destinoFiltro}
            onChange={(e) => setDestinoFiltro(e.target.value)}
            className="bg-zinc-700 text-white p-1 rounded"
          >
            <option value="todos">Todos</option>
            {depositos.map((d) => (
              <option key={d._id} value={d._id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por días */}
        <div>
          <label className="mr-2">Últimos días:</label>
          <input
            type="number"
            min="0"
            value={diasFiltro}
            onChange={(e) => setDiasFiltro(Number(e.target.value))}
            className="bg-zinc-700 text-white p-1 rounded w-20"
          />
        </div>
      </div>

      {/* Lista de traspasos filtrados */}
      <div className="space-y-4">
        {filtrados.length === 0 ? (
          <p className="text-zinc-400">No hay traspasos que coincidan.</p>
        ) : (
          filtrados.map((t) => {
            const total = t.detalles.reduce((acc, d) => acc + d.cantidad, 0);

            return (
              <div
                key={t._id}
                className="border border-white rounded-xl p-4 shadow-sm flex flex-col gap-2 bg-zinc-800"
              >
                <div className="flex justify-between">
                  <div className="text-zinc-300">
                    <p>
                      <b>Origen:</b> <span>{t.origenNombre}</span>
                      <span className="ml-5 text-sm text-zinc-400">
                        {new Date(t.fecha).toLocaleString()}
                      </span>
                    </p>
                    <p>
                      <b>Destino:</b> <span>{t.destinoNombre}</span>
                    </p>
                    <p>
                      <b>Estado:</b>{" "}
                      <span
                        className={
                          t.estado === "confirmado"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }
                      >
                        {t.estado}
                      </span>
                    </p>
                  </div>
                  {t.estado === "pendiente" && (
                    <Button
                      className="bg-indigo-700 text-white"
                      onClick={() => confirmarTraspaso({ traspasoId: t._id })}
                    >
                      ✅ Confirmar
                    </Button>
                  )}
                </div>

                <div>
                  <b className="text-zinc-300">Detalles:</b>
                  <ul className="space-y-1 mt-2">
                    {t.detalles.map((d) => (
                      <li
                        key={d._id}
                        className="flex items-center border-b py-1 text-sm"
                      >
                        <span className="text-white">
                          🔧 <b>{d.repuestoCodigo}</b> —{" "}
                          <span>{d.repuestoNombre}</span>
                        </span>
                        <span className="ml-3 text-green-600">
                          x{d.cantidad}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-3 text-zinc-300 font-semibold">
                    Total: <span className="text-white">{total}</span> unidades
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
