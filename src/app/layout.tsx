import type { Metadata } from "next";
import "./globals.css";
import ConvexClientProvider from "./providers/convex-provider";
import Sidebar from "../components/sidebar";
import { ThemeProvider } from "next-themes";
import ThemeToggle from "../components/ThemeToggle";

export const metadata: Metadata = {
  title: "Gestión de Transportes",
  description: "Sistema de transporte con Next.js + Convex",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ConvexClientProvider>
            <div className="min-h-screen grid grid-cols-1 md:grid-cols-[16rem_1fr]">
              <Sidebar />

              <div className="flex flex-col">
                {/* Header */}
                <header className="bg-white dark:bg-[#141414] flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                  <h1 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-gray-100">
                    Sistema de Transporte
                  </h1>

                  {/* Acciones de usuario */}
                  <div className="flex items-center space-x-4">
                    {/* 🔍 Buscar (opcional, si lo querés en todas las páginas) */}
                    {/* 
                    <input
                      type="text"
                      placeholder="Buscar..."
                      className="bg-gray-50 dark:bg-[#1e1e1e] text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    */}

                    {/* 🌙/☀️ Toggle de tema */}
                    <ThemeToggle />

                    {/* Avatar / Usuario */}
                    <div className="w-10 h-10 rounded-full bg-gray-400" />
                  </div>
                </header>

                {/* Contenido */}
                <main className="flex-1 p-6 bg-gray-50 dark:bg-[#141414] overflow-y-auto">
                  {children}
                </main>
              </div>
            </div>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
