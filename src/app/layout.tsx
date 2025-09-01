import type { Metadata } from "next";
import "./globals.css";
import ConvexClientProvider from "./providers/convex-provider";
import Sidebar from "../components/sidebar";

export const metadata: Metadata = {
  title: "Gestión de Transportes",
  description: "Sistema de transporte con Next.js + Convex",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="bg-[#0d0d0d] text-gray-100">
      <body className="antialiased">
        <ConvexClientProvider>
          <div className="min-h-screen grid grid-cols-1 md:grid-cols-[16rem_1fr]">
            <Sidebar />

            <div className="flex flex-col">
              {/* Header */}
              <header className="bg-[#141414] flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <h1 className="text-xl font-semibold tracking-wide text-white">
                  🚍 Sistema de Transporte
                </h1>

                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="bg-[#1e1e1e] text-sm px-3 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button className="w-9 h-9 rounded-full bg-[#1e1e1e] flex items-center justify-center border border-gray-700 hover:border-violet-500">
                    ⚙️
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gray-500" />
                </div>
              </header>

              {/* Contenido */}
              <main className="flex-1 p-6 bg-[#141414] overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
