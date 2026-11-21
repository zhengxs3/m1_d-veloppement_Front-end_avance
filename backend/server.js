import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";

// Configuration par variables d'environnement (voir .env.example).
const databasePath =
  process.env.POKEDEX_DATABASE_PATH ||
  fileURLToPath(new URL("./var/pokedex.sqlite", import.meta.url));
const allowedOrigins = (
  process.env.FRONTEND_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((origin) => origin.trim());
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT) || 8000;

const app = createApp({ databasePath, allowedOrigins });
const server = app.listen(port, host, () => {
  console.log(`API de développement : http://${host}:${port}/api/health`);
});

// Arrêt propre : ferme le serveur puis la base.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => app.close().then(() => process.exit(0))));
}
