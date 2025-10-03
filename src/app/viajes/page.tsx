"use client";
import React from "react";
import { Search, MoreVertical, Truck } from "lucide-react";

export default function ViajesPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Viajes</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar viajes..."
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-200 w-64"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm p-6 relative">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 p-4 rounded-xl">
              <Truck className="text-yellow-600" size={28} />
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Viajes</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">1240</p>
            </div>
          </div>
          <MoreVertical className="absolute right-4 top-4 text-gray-400 cursor-pointer" size={20} />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Listado de Viajes</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#111] text-gray-600 dark:text-gray-300">
              <th className="p-3">Cliente</th>
              <th className="p-3">Origen</th>
              <th className="p-3">Destino</th>
              <th className="p-3">Distancia (km)</th>
              <th className="p-3">Importe</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-200 dark:border-gray-700">
              <td className="p-3">Transportes Andes</td>
              <td className="p-3">Mina A</td>
              <td className="p-3">Planta B</td>
              <td className="p-3">120</td>
              <td className="p-3">$30.000</td>
            </tr>
            <tr className="border-t border-gray-200 dark:border-gray-700">
              <td className="p-3">Logística Sur</td>
              <td className="p-3">Mina C</td>
              <td className="p-3">Puerto D</td>
              <td className="p-3">350</td>
              <td className="p-3">$87.500</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
