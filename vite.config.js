import { defineConfig } from "vite";

// Extension React : prise en charge de JSX et de React.
import react from "@vitejs/plugin-react";

// Extension Tailwind CSS : prise en charge des styles Tailwind.
import tailwindcss from "@tailwindcss/vite";

// Configuration du projet Vite
export default defineConfig({
  build: { outDir: "build" },
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
  plugins: [
    react(), // Activer React
    tailwindcss(), // Activer Tailwind CSS
  ],
});
