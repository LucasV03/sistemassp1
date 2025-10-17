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
    <html lang="es">
      <body className="antialiased bg-[#f8fafa] text-gray-900">
        <ConvexClientProvider>
          <div className="min-h-screen grid grid-cols-1 md:grid-cols-[16rem_1fr]">
            {/* 🔹 Sidebar */}
            <Sidebar />

            {/* 🔹 Panel principal */}
            <div className="flex flex-col min-h-screen bg-[#f8fafa]">
              {/* Header */}
              <header className="bg-[#0f766e] flex items-center justify-between px-6 py-4 border-b border-gray-200 shadow-sm">
                <h1 className="text-xl font-semibold tracking-wide text-[#ffffff]">
                  Sistema de Transporte
                </h1>

                {/* Avatar / Usuario */}
                <div className="w-10 h-10 rounded-full bg-[#0f766e]" />
              </header>

              {/* Contenido principal */}
              <main className="flex-1 p-6 overflow-y-auto bg-[#0f766e]">
                {children}
              </main>
            </div>
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
