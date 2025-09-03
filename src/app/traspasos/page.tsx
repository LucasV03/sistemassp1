"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";

export default function TraspasosPage() {
  const traspasos = useQuery(api.traspasos.listarTraspasos);
  const confirmarTraspaso = useMutation(api.traspasos.confirmarTraspaso);

  if (!traspasos) return <div>Cargando...</div>;

  return (
    <div className="p-6 space-y-6 ">
      <h1 className="text-2xl font-bold text-white">📦 Traspasos</h1>
      <a href="/traspasos/nuevo">
        <Button className="text-white bg-indigo-700 mb-3">➕ Nuevo Traspaso</Button>
      </a>

      <div className="space-y-4">
        {traspasos.map((t) => (
          <div
            key={t._id}
            className="border border-white rounded-xl p-4 shadow-sm flex flex-col gap-2 bg-zinc-800"
          >
            <div className="flex justify-between">
              <div className="text-zinc-300">
                <p><b>Origen:</b> <span> {t.origenNombre}</span></p>
                <p><b>Destino:</b> <span>{t.destinoNombre}</span></p>
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
  <b className="text-zinc-300 ">Detalles:</b>
  <ul className="space-y-1 mt-2">
    {t.detalles.map((d) => (
      <li
        key={d._id}
        className="flex  items-center border-b py-1 text-sm"
      >
        <span className="text-white ">
          🔧 <b>{d.repuestoCodigo}</b> — <span>{d.repuestoNombre}</span>
        </span>
        <span className="ml-3 text-green-600">x{d.cantidad}</span>
      </li>
    ))}
  </ul>
</div>

          </div>
        ))}
      </div>
    </div>
  );
}
