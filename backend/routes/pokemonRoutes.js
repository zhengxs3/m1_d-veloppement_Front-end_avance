import { Router } from "express";

// Importer les fonctions
import {
  createPokemon,
  deletePokemon,
  getPokemonById,
  getPokemons,
  importPokemons,
  updatePokemon,
} from "../controllers/pokemonController.js";
import jsonMiddleware from "../middlewares/jsonMiddleware.js";
import { isValidId } from "../models/Pokemon.js";

// Créer le routeur (monté sur /api/pokemons dans app.js)
const router = Router();

// Méthode non prise en charge
const methodNotAllowed = (req, res) =>
  res.status(405).json({ error: "Méthode non autorisée." });

// Afficher les créations et en ajouter une
router.route("/").get(getPokemons).post(jsonMiddleware, createPokemon).all(methodNotAllowed);

// Importer d'anciennes créations (placer avant router.get("/:id"))
router.post("/import", jsonMiddleware, importPokemons);

// Vérifier l'identifiant : il doit avoir la forme perso-xxxx
router.param("id", (req, res, next, id) =>
  isValidId(id) ? next() : res.status(404).json({ error: "Route introuvable." }),
);

// Afficher, modifier et supprimer une création
router
  .route("/:id")
  .get(getPokemonById)
  .put(jsonMiddleware, updatePokemon)
  .delete(deletePokemon)
  .all(methodNotAllowed);

export default router;
