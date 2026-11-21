import express from "express";
import corsMiddleware from "./middlewares/corsMiddleware.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";
import Pokemon from "./models/Pokemon.js";
import PokemonRepository from "./models/PokemonRepository.js";
import pokemonRoutes from "./routes/pokemonRoutes.js";

// Créer l'application : middlewares → routes → contrôleurs → modèle (SQLite).
// Elle est séparée de server.js pour pouvoir être testée sans écouter de port.
export function createApp({ databasePath, allowedOrigins }) {
  const app = express();
  app.disable("x-powered-by");

  // La base est ouverte à la première requête ; un échec est signalé par un code 503.
  let storage = null;
  const getRepository = () => {
    storage ??= PokemonRepository.open(databasePath).catch(() => {
      storage = null;
      throw Object.assign(new Error("Le stockage des créations est indisponible."), {
        status: 503,
      });
    });
    return storage;
  };
  // Relier le modèle Pokemon à cette base (comme mongoose.connect dans le cours)
  Pokemon.connect(getRepository);
  app.close = async () => {
    if (storage) (await storage.catch(() => null))?.close();
    storage = null;
  };

  // Middleware
  app.use(corsMiddleware(allowedOrigins));

  // Route de test
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.use("/api/pokemons", pokemonRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
