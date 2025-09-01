"use client";
import React, { useState } from "react";

export default function RepuestoCard({
  repuesto,
  onUpdate,
  onDelete,
}: {
  repuesto: any;
  onUpdate: () => void;
  onDelete: () => void;
}) {
  const [showMore, setShowMore] = useState(false);

  return (
    <article
      className="
        border border-neutral-200 dark:border-neutral-700
        rounded-xl p-5 shadow-sm
        bg-white dark:bg-neutral-900
        hover:shadow-md transition
        flex flex-col justify-between
      "
    >
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {repuesto.nombre}
        </h3>

        {repuesto.descripcion && (
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
            {repuesto.descripcion}
          </p>
        )}

        {/* Resumen */}
        <div className="text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
          <p>
            <b className="text-neutral-900 dark:text-neutral-100">Código:</b>{" "}
            {repuesto.codigo}
          </p>
          <p>
            <b className="text-neutral-900 dark:text-neutral-100">Stock:</b>{" "}
            {repuesto.stock}
          </p>
          <p>
            <b className="text-neutral-900 dark:text-neutral-100">Precio:</b> $
            {repuesto.precioUnitario}
          </p>
        </div>

        {/* Toggle ver más */}
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="
            mt-2 text-sm font-medium
            text-slate-800 dark:text-slate-300
            hover:underline
          "
        >
          {showMore ? "Ver menos ▲" : "Ver más ▼"}
        </button>

        {/* Detalle */}
        {showMore && (
          <div className="mt-2 text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
            {repuesto.descripcion && (
              <p>
                <b className="text-neutral-900 dark:text-neutral-100">
                  Descripción:
                </b>{" "}
                {repuesto.descripcion}
              </p>
            )}
            {repuesto.categoria && (
              <p>
                <b className="text-neutral-900 dark:text-neutral-100">
                  Categoría:
                </b>{" "}
                {repuesto.categoria}
              </p>
            )}
            {repuesto.vehiculo && (
              <p>
                <b className="text-neutral-900 dark:text-neutral-100">
                  Vehículo:
                </b>{" "}
                {repuesto.vehiculo}
              </p>
            )}
            {repuesto.marca && (
              <p>
                <b className="text-neutral-900 dark:text-neutral-100">Marca:</b>{" "}
                {repuesto.marca}
              </p>
            )}
            {repuesto.modeloCompatible && (
              <p>
                <b className="text-neutral-900 dark:text-neutral-100">
                  Modelo:
                </b>{" "}
                {repuesto.modeloCompatible}
              </p>
            )}
            {repuesto.ubicacion && (
              <p>
                <b className="text-neutral-900 dark:text-neutral-100">
                  Ubicación:
                </b>{" "}
                {repuesto.ubicacion}
              </p>
            )}
            {repuesto.fechaIngreso && (
              <p>
                <b className="text-neutral-900 dark:text-neutral-100">
                  Ingreso:
                </b>{" "}
                {new Date(repuesto.fechaIngreso).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onUpdate}
          className="
            flex-1 px-3 py-1 text-sm rounded-lg
            text-white bg-slate-800 hover:bg-slate-700
            shadow
          "
        >
          Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="
            flex-1 px-3 py-1 text-sm rounded-lg
            text-white bg-rose-600 hover:bg-rose-700
            shadow
          "
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}
