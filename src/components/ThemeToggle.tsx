"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // evita flash raro en SSR

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#1e1e1e] flex items-center justify-center border border-gray-300 dark:border-gray-700 hover:border-teal-500 transition"
    >
      {theme === "light" ? (
        <Moon className="text-gray-800" size={18} />
      ) : (
        <Sun className="text-yellow-400" size={18} />
      )}
    </button>
  );
}
