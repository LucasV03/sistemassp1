"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";

export default function TraspasosPage() {
  const traspasos = useQuery(api.traspasos.listarTraspasos);
  const confirmarTraspaso = useMutation(api.traspasos.confirmarTraspaso);

  if (!traspasos) return <div>Cargando...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📦 Traspasos</h1>
      <a href="/traspasos/nuevo">
        <Button>➕ Nuevo Traspaso</Button>
      </a>

      <div className="space-y-4">
        {traspasos.map((t) => (
          <div
            key={t._id}
            className="border rounded-xl p-4 shadow-sm flex flex-col gap-2"
          >
            <div className="flex justify-between">
              <div>
                <p><b>Origen:</b> {t.origenId}</p>

<p><b>Destino:</b> {t.destinoId}</p>
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
                  onClick={() => confirmarTraspaso({ traspasoId: t._id })}
                >
                  ✅ Confirmar
                </Button>
              )}
            </div>

            <div>
              <b>Detalles:</b>
              <ul className="list-disc ml-6">
                {t.detalles.map((d) => (
                 <li key={d._id}>Repuesto {d.repuestoId} → {d.cantidad}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
