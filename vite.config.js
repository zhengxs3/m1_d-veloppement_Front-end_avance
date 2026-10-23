
import { defineConfig } from "vite";

// Extension React : prise en charge de JSX et de React.
import react from "@vitejs/plugin-react";

// Extension Tailwind CSS : prise en charge des styles Tailwind.
import tailwindcss from "@tailwindcss/vite";

// Configuration du projet Vite
export default defineConfig({
  plugins: [
    react(),       // Activer React
    tailwindcss(), // Activer Tailwind CSS
  ],
});
