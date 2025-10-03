import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class", // ⬅️ Esto activa dark mode con la clase "dark"
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores base que podés usar en toda la app
        brand: {
          light: "#14B8A6", // teal-500
          dark: "#0f766e",  // teal-700
        },
      },
    },
  },
  plugins: [],
}

export default config
