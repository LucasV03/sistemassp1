"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
// Asumiendo que esta es una importación local de tu proyecto, no la modifico
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

  // Ajuste el color de fondo para la carga
  if (!deposito || !stock || !traspasos || !movimientos) return <div className="min-h-screen bg-[#0b1618] text-gray-100 p-6">Cargando...</div>;

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
    // Fondo principal: Usamos el color oscuro `#0b1618`
    <div className="min-h-screen bg-[#0b1618] p-6 space-y-6 text-gray-100">
      <h1 className="text-2xl font-bold text-white">🏭 Depósito {deposito.nombre}</h1>
      
      {/* Botón Volver ajustado a la estética oscura (bg-[#11292e] y border-[#1e3c42]) */}
      <Button 
        className="bg-[#11292e] border border-[#1e3c42] text-white hover:bg-[#1e3c42]" 
        variant="outline" 
        onClick={() => window.history.back()}
      >
        Volver
      </Button>

      {/* ===== STOCK ===== */}
      {/* Contenedor de stock - Usamos el color de caja/fondo secundario: `#11292e` */}
      <div className="border border-[#1e3c42] rounded-xl p-4 shadow-lg bg-[#11292e]">
        <h2 className="text-xl font-semibold mb-2 text-white">📦 Stock de Repuestos</h2>
        {stock.length === 0 ? (
          <p className="text-red-400">No hay repuestos en este depósito</p>
        ) : (
          <ul className="space-y-1">
            {stock.map((s) => (
              <li key={s._id} className="flex items-center border-b border-[#1e3c42] py-1 text-sm">
                <span className="text-gray-400">🔧 {s.repuesto?.nombre ?? "Desconocido"}</span>
                <span className="font-semibold pl-5 text-green-500">x{s.stock_actual}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ===== TRASPASOS + MOVIMIENTOS ===== */}
      {/* Contenedor principal - Usamos el color de caja/fondo secundario: `#11292e` */}
      <div className="border border-[#1e3c42] rounded-xl p-4 shadow-lg bg-[#11292e]">
        <h2 className="text-xl font-semibold mb-2 text-white">📦 Traspasos y Movimientos</h2>

        {/* Filtros - Ajustados para usar el color de fondo como 'default' */}
        <div className="flex gap-2 mb-4">
          <Button 
            variant={filtro === "todos" ? "default" : "outline"} 
            className={filtro === "todos" ? "bg-[#36b6b0] hover:bg-[#2ca6a4] text-white" : "bg-transparent border-[#1e3c42] text-gray-300 hover:bg-[#1e3c42]"}
            onClick={() => setFiltro("todos")}
          >
            Todos
          </Button>
          <Button 
            variant={filtro === "pendiente" ? "default" : "outline"} 
            className={filtro === "pendiente" ? "bg-[#36b6b0] hover:bg-[#2ca6a4] text-white" : "bg-transparent border-[#1e3c42] text-gray-300 hover:bg-[#1e3c42]"}
            onClick={() => setFiltro("pendiente")}
          >
            Pendientes
          </Button>
          <Button 
            variant={filtro === "confirmado" ? "default" : "outline"} 
            className={filtro === "confirmado" ? "bg-[#36b6b0] hover:bg-[#2ca6a4] text-white" : "bg-transparent border-[#1e3c42] text-gray-300 hover:bg-[#1e3c42]"}
            onClick={() => setFiltro("confirmado")}
          >
            Confirmados
          </Button>
        </div>

        {itemsFiltrados.length === 0 ? (
          <p className="text-red-400">No hay items con este filtro</p>
        ) : (
          <div className="space-y-4">
            {itemsFiltrados.map((i) => (
              // Caja individual de item - Mantenemos el fondo de la caja, ajustamos el borde
              <div key={i._id} className="border rounded-xl p-4 shadow-sm flex flex-col gap-2 border-[#1e3c42] bg-[#1a3035]"> 
                <div className="flex justify-between">
                  <div>
                    {i.tipo === "traspaso" ? (
                      <>
                        <p><b className="text-white">Origen:</b> <span className="text-gray-300">{i.origenNombre} </span></p>
                        <p><b className="text-white">Destino:</b> <span className="text-gray-300">{i.destinoNombre}</span></p>
                        <p>
                          <b className="text-white">Estado:</b>{" "}
                          <span className={i.estado === "confirmado" ? "text-green-500 font-medium" : "text-yellow-500 font-medium"}>
                            {i.estado}
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p><b className="text-white">Movimiento:</b> <span className="text-gray-300">{i.tipoMovimiento}</span></p>
                        <p><b className="text-white">Comprobante:</b> <span className="text-gray-300">{i.tipoComprobante}</span></p>
                        <p><b className="text-white">Fecha:</b> <span className="text-gray-300">{i.fecha_registro}</span></p>
                      </>
                    )}
                  </div>

                  {i.tipo === "traspaso" && i.estado === "pendiente" && (
                    <Button 
                    // Botón de confirmación ajustado al color de acento teal
                    className="bg-[#36b6b0] hover:bg-[#2ca6a4] text-white" 
                    onClick={() => confirmarTraspaso({ traspasoId: i._id })}>
                      ✅ Confirmar
                    </Button>
                  )}
                </div>

                <div>
                  <b className="text-white">Detalles:</b>
                  <ul className="space-y-1 mt-2">
                    {i.detalles.map((d) => (
                      <li
                        key={d._id}
                        className="flex items-center border-b border-[#1e3c42] py-1 text-sm"
                      >
                        <span className="mr-2">🔧</span>
                        <span className="text-gray-200">
                          {i.tipo === "traspaso"
                            ? d.repuestoNombre
                            : d.repuestoNombre /* movimientos usan repuestoNombre directamente */}
                        </span>
                        <span className="font-semibold text-green-500 pl-2">x{d.cantidad}</span>
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