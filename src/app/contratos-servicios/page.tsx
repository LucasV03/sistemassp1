"use client";
import React from "react";
import { Search, MoreVertical, FileText } from "lucide-react";

export default function ContratosPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Contratos de Servicios</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar contratos..."
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-200 w-64"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm p-6 relative">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-xl">
              <FileText className="text-blue-600" size={28} />
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Contratos Vigentes</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">45</p>
            </div>
          </div>
          <MoreVertical className="absolute right-4 top-4 text-gray-400 cursor-pointer" size={20} />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Listado de Contratos</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#111] text-gray-600 dark:text-gray-300">
              <th className="p-3">Cliente</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Tarifa</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-200 dark:border-gray-700">
              <td className="p-3">Transportes Andes</td>
              <td className="p-3">Por KM</td>
              <td className="p-3">$250/km</td>
              <td className="p-3 text-green-600">Vigente</td>
            </tr>
            <tr className="border-t border-gray-200 dark:border-gray-700">
              <td className="p-3">Logística Sur</td>
              <td className="p-3">Por Viaje</td>
              <td className="p-3">$50.000</td>
              <td className="p-3 text-red-600">Finalizado</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
