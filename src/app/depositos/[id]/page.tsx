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
      <h1 className="text-2xl font-bold">🏭 Depósito {deposito.nombre}</h1>

      {/* ===== STOCK ===== */}
      <div className="border rounded-xl p-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">📦 Stock de Repuestos</h2>
        {stock.length === 0 ? (
          <p className="text-gray-500">No hay repuestos en este depósito</p>
        ) : (
          <ul className="space-y-1">
            {stock.map((s) => (
              <li key={s._id} className="flex justify-between items-center border-b py-1 text-sm">
                <span>🔧 {s.repuesto?.nombre ?? "Desconocido"}</span>
                <span className="font-semibold text-blue-600">{s.stock_actual}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ===== TRASPASOS + MOVIMIENTOS ===== */}
      <div className="border rounded-xl p-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">📦 Traspasos y Movimientos</h2>

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
          <p className="text-gray-500">No hay items con este filtro</p>
        ) : (
          <div className="space-y-4">
            {itemsFiltrados.map((i) => (
              <div key={i._id} className="border rounded-xl p-4 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between">
                  <div>
                    {i.tipo === "traspaso" ? (
                      <>
                        <p><b>Origen:</b> {i.origenNombre}</p>
                        <p><b>Destino:</b> {i.destinoNombre}</p>
                        <p>
                          <b>Estado:</b>{" "}
                          <span className={i.estado === "confirmado" ? "text-green-600" : "text-yellow-600"}>
                            {i.estado}
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p><b>Movimiento:</b> {i.tipoMovimiento}</p>
                        <p><b>Comprobante:</b> {i.tipoComprobante}</p>
                        <p><b>Fecha:</b> {i.fecha_registro}</p>
                      </>
                    )}
                  </div>

                  {i.tipo === "traspaso" && i.estado === "pendiente" && (
                    <Button onClick={() => confirmarTraspaso({ traspasoId: i._id })}>✅ Confirmar</Button>
                  )}
                </div>

                <div>
                  <b>Detalles:</b>
                  <ul className="space-y-1 mt-2">
  {i.detalles.map((d) => (
    <li
      key={d._id}
      className="flex justify-between items-center border-b py-1 text-sm"
    >
      <span>
        {i.tipo === "traspaso"
          ? d.repuestoNombre
          : d.repuestoNombre /* movimientos usan repuestoNombre directamente */}
      </span>
      <span className="font-semibold text-blue-600">x{d.cantidad}</span>
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
