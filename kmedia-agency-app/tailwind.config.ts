import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Colores de marca — fondo claro, acentos sobrios
        brand: {
          50: "#eef4ff",
          100: "#dce8ff",
          500: "#3b5bdb",
          600: "#2f4bc4",
          700: "#26399a",
        },
        // Colores de estado — usados consistentemente en toda la app
        status: {
          success: "#16a34a",
          successBg: "#dcfce7",
          warning: "#d97706",
          warningBg: "#fef3c7",
          danger: "#dc2626",
          dangerBg: "#fee2e2",
          neutral: "#6b7280",
          neutralBg: "#f3f4f6",
        },
      },
      borderRadius: {
        card: "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
