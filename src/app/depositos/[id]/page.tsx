"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type Filtro = "todos" | "pendiente" | "confirmado";

export default function DepositoPage() {
  const { id } = useParams<{ id: string }>();

  // === DATA ===
  const deposito = useQuery(api.depositos.getDeposito, { depositoId: id as any });
  const stock = useQuery(api.depositos.listarStockPorDeposito, { depositoId: id as any });
  const traspasos = useQuery(api.traspasos.listarPorDeposito, { depositoId: id as any });
  const movimientos = useQuery(api.movimientos.listarPorDeposito, { depositoId: id as any });

  const confirmarTraspaso = useMutation(api.traspasos.confirmarTraspaso);

  const [filtro, setFiltro] = useState<Filtro>("todos");

  if (!deposito || !stock || !traspasos || !movimientos) return <div>Cargando...</div>;

  // === COMBINAR ITEMS ===
  type Item = 
    | (typeof traspasos[number] & { tipo: "traspaso" })
    | (typeof movimientos[number] & { tipo: "movimiento" });

  const items: Item[] = [
    ...traspasos.map((t) => ({ ...t, tipo: "traspaso" } as const)),
    ...movimientos.map((m) => ({ ...m, tipo: "movimiento" } as const)),
  ];

  const itemsFiltrados = items.filter((i) => {
    if (i.tipo === "traspaso") {
      if (filtro === "todos") return true;
      return i.estado === filtro;
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">🏭 Depósito {deposito.nombre}</h1>

      {/* ===== STOCK ===== */}
      <div className="border border-white rounded-xl p-4 shadow-sm bg-zinc-800">
        <h2 className="text-xl font-semibold mb-2 text-zinc-300">📦 Stock de Repuestos</h2>
        {stock.length === 0 ? (
          <p className="text-red-600">No hay repuestos en este depósito</p>
        ) : (
          <ul className="space-y-1">
            {stock.map((s) => (
              <li key={s._id} className="flex items-center border-b py-1 text-sm">
                <span className="text-zinc-400">🔧 {s.repuesto?.nombre ?? "Desconocido"}</span>
                <span className="font-semibold pl-5 text-green-600">x{s.stock_actual}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ===== TRASPASOS + MOVIMIENTOS ===== */}
      <div className="border border-white rounded-xl p-4 shadow-sm bg-zinc-800">
        <h2 className="text-xl font-semibold mb-2 text-zinc-300">📦 Traspasos y Movimientos</h2>

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          <Button variant={filtro === "todos" ? "default" : "outline"} onClick={() => setFiltro("todos")}>
            Todos
          </Button>
          <Button variant={filtro === "pendiente" ? "default" : "outline"} onClick={() => setFiltro("pendiente")}>
            Pendientes
          </Button>
          <Button variant={filtro === "confirmado" ? "default" : "outline"} onClick={() => setFiltro("confirmado")}>
            Confirmados
          </Button>
        </div>

        {itemsFiltrados.length === 0 ? (
          <p className="text-red-600">No hay items con este filtro</p>
        ) : (
          <div className="space-y-4">
            {itemsFiltrados.map((i) => (
              <div key={i._id} className="border rounded-xl p-4 shadow-sm flex flex-col gap-2 border-white">
                <div className="flex justify-between">
                  <div>
                    {i.tipo === "traspaso" ? (
                      <>
                        <p><b className="text-zinc-300">Origen:</b> <span className="text-zinc-300">{i.origenNombre} </span></p>
                        <p><b className="text-zinc-300">Destino:</b> <span className="text-zinc-300">{i.destinoNombre}</span></p>
                        <p>
                          <b className="text-zinc-300">Estado:</b>{" "}
                          <span className={i.estado === "confirmado" ? "text-green-600" : "text-yellow-600"}>
                            {i.estado}
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p><b className="text-zinc-300">Movimiento:</b> <span className="text-zinc-300">{i.tipoMovimiento}</span></p>
                        <p><b className="text-zinc-300">Comprobante:</b> <span className="text-zinc-300">{i.tipoComprobante}</span></p>
                        <p><b className="text-zinc-300">Fecha:</b> <span className="text-zinc-300">{i.fecha_registro}</span></p>
                      </>
                    )}
                  </div>

                  {i.tipo === "traspaso" && i.estado === "pendiente" && (
                    <Button 
                    className="bg-indigo-700 text-white"
                    onClick={() => confirmarTraspaso({ traspasoId: i._id })}>✅ Confirmar</Button>
                  )}
                </div>

                <div>
                  <b className="text-zinc-300">Detalles:</b>
                  <ul className="space-y-1 mt-2">
  {i.detalles.map((d) => (
    <li
      key={d._id}
      className="flex items-center border-b py-1 text-sm"
    >
      🔧
      <span className="text-zinc-200">
        {i.tipo === "traspaso"
          ? d.repuestoNombre
          : d.repuestoNombre /* movimientos usan repuestoNombre directamente */}
      </span>
      <span className="font-semibold text-green-600 pl-2">x{d.cantidad}</span>
    </li>
  ))}
</ul>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
