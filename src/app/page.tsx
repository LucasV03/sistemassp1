
"use client";

import dynamic from "next/dynamic";


export default function Home() {
  
  
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Encabezado */}
      <header className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          Panel operativo
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
          
        </p>
      </header>

      {/* KPIs (flex + wrap) */}
      

      {/* Dos columnas con flex (col -> row en xl) */}
      
       
    </main>
  );
}



function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-xl border border-neutral-200 dark:border-neutral-800",
        "bg-white dark:bg-neutral-900 p-4 shadow-sm",
        className,
      ].join(" ")}
    >
      <div className="mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h2>
      </div>
      <div className="text-neutral-700 dark:text-neutral-300">
        {children}
      </div>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left font-medium">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={["px-3 py-2 text-neutral-700 dark:text-neutral-300", className].join(" ")}>
      {children}
    </td>
  );
}
