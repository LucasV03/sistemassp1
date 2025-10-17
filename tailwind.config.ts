import type { Config } from "tailwindcss";

const config: Config = {
  // ❌ Eliminamos soporte dark mode
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#14B8A6", // teal principal
          dark: "#0f766e",  // teal más oscuro para hover o bordes
        },
      },
    },
  },
  plugins: [],
};

export default config;
