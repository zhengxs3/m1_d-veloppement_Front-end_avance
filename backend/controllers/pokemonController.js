import Pokemon from "../models/Pokemon.js";

const NOT_FOUND = "Pokémon personnel introuvable.";
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

// Répondre à une erreur : 422 (données invalides), 503 (stockage indisponible) ou 500.
const sendError = (res, error) => {
  if (error.status) return res.status(error.status).json({ error: error.message });
  res.status(500).json({ error: "Erreur interne du serveur." });
};

// GET /api/pokemons
export const getPokemons = async (req, res) => {
  try {
    const pokemons = await Pokemon.find();
    res.status(200).json(pokemons);
  } catch (err) {
    sendError(res, err);
  }
};

// GET /api/pokemons/:id
export const getPokemonById = async (req, res) => {
  try {
    const pokemon = await Pokemon.findById(req.params.id);
    if (!pokemon) {
      return res.status(404).json({ error: NOT_FOUND });
    }
    res.status(200).json(pokemon);
  } catch (err) {
    sendError(res, err);
  }
};

// POST /api/pokemons
export const createPokemon = async (req, res) => {
  try {
    const pokemon = await Pokemon.create(req.json);
    res.status(201).location(`/api/pokemons/${pokemon.id}`).json(pokemon);
  } catch (err) {
    sendError(res, err);
  }
};

// PUT /api/pokemons/:id
export const updatePokemon = async (req, res) => {
  try {
    const pokemon = await Pokemon.findByIdAndUpdate(req.params.id, req.json);
    if (!pokemon) {
      return res.status(404).json({ error: NOT_FOUND });
    }
    res.status(200).json(pokemon);
  } catch (err) {
    sendError(res, err);
  }
};

// DELETE /api/pokemons/:id
export const deletePokemon = async (req, res) => {
  try {
    const pokemon = await Pokemon.findByIdAndDelete(req.params.id);
    if (!pokemon) {
      return res.status(404).json({ error: NOT_FOUND });
    }
    res.status(204).end();
  } catch (err) {
    sendError(res, err);
  }
};

// POST /api/pokemons/import
// Copier d'anciennes créations (100 maximum), sans doublon.
export const importPokemons = async (req, res) => {
  try {
    const entries = req.json.pokemons;
    if (!Array.isArray(entries) || entries.length > 100) {
      return res
        .status(400)
        .json({ error: 'Import attendu : {"pokemons": [...]} (100 créations maximum).' });
    }
    if (!entries.every(isObject)) {
      return res.status(400).json({ error: "Création invalide." });
    }
    const pokemons = await Pokemon.insertMany(entries);
    res.status(200).json(pokemons);
  } catch (err) {
    sendError(res, err);
  }
};
