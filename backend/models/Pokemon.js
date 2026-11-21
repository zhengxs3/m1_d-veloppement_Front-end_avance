import { randomBytes } from "node:crypto";

const TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];
const STATS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
const ID_PATTERN = /^perso-[a-zA-Z0-9-]{1,80}$/;
const PLACEHOLDER = "/pokemon-placeholder.svg";

// Erreur de validation : le contrôleur la transforme en réponse 422.
export class ValidationError extends Error {
  status = 422;
}
const invalid = (message) => new ValidationError(message);
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
// Nombre fini, donné sous forme de nombre ou de texte numérique.
const toNumber = (value) => {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
      ? Number(value)
      : NaN;
  return Number.isFinite(number) ? number : null;
};

function text(value, max, label) {
  if (typeof value !== "string" || [...value.trim()].length > max) {
    throw invalid(`Champ invalide : ${label}.`);
  }
  return value.trim();
}

export const isValidId = (id) => typeof id === "string" && ID_PATTERN.test(id);

// Valide une création et retourne la version enregistrée.
// existingId : conserve l'identifiant lors d'une modification.
// isImport : reprend l'identifiant fourni par l'ancienne création.
export function validatePokemon(input, { isImport = false, existingId = null } = {}) {
  const nom = text(input.nom ?? "", 60, "nom");
  if (nom === "") throw invalid("Le nom est obligatoire.");

  for (const [field, max] of [
    ["height", 10000],
    ["weight", 1000000],
  ]) {
    const value = toNumber(input[field]);
    if (value === null || value < 1 || value > max) throw invalid(`Valeur invalide : ${field}.`);
  }

  const types = input.types;
  if (!Array.isArray(types) || types.length < 1 || types.length > 2) {
    throw invalid("Choisissez un ou deux types.");
  }
  const typeNames = [];
  for (const entry of types) {
    const name = isObject(entry) && isObject(entry.type) ? entry.type.name : null;
    if (!TYPES.includes(name) || typeNames.includes(name)) {
      throw invalid("Type invalide ou répété.");
    }
    typeNames.push(name);
  }

  const stats = input.stats;
  if (!Array.isArray(stats) || stats.length !== 6) {
    throw invalid("Les six statistiques sont obligatoires.");
  }
  const statValues = {};
  for (const entry of stats) {
    const name = isObject(entry) && isObject(entry.stat) ? entry.stat.name : null;
    const value = isObject(entry) ? toNumber(entry.base_stat) : null;
    if (
      !STATS.includes(name) ||
      name in statValues ||
      value === null ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > 255
    ) {
      throw invalid("Statistique invalide : valeur entière de 1 à 255 attendue.");
    }
    statValues[name] = value;
  }

  const sprites = input.sprites ?? {};
  if (!isObject(sprites)) throw invalid("Illustration invalide.");
  const image = text(sprites.front_default ?? "", 2000, "illustration");
  if (image !== "" && image !== PLACEHOLDER) {
    let protocol = "";
    try {
      protocol = new URL(image).protocol;
    } catch {
      /* URL invalide : refusée ci-dessous */
    }
    if (protocol !== "http:" && protocol !== "https:") {
      throw invalid("L’illustration doit utiliser une URL http ou https.");
    }
  }

  let id = existingId ?? `perso-${randomBytes(16).toString("hex")}`;
  if (isImport) {
    id = input.id;
    if (!isValidId(id)) throw invalid("Identifiant de création invalide.");
  }

  return {
    id,
    isCustom: true,
    nom,
    name: nom.toLowerCase(),
    description: text(input.description ?? "", 1500, "description"),
    category: text(input.category ?? "", 80, "catégorie"),
    customAbility: text(input.customAbility ?? "", 120, "talent"),
    height: toNumber(input.height),
    weight: toNumber(input.weight),
    types: typeNames.map((name) => ({ type: { name } })),
    sprites: { front_default: image || PLACEHOLDER },
    stats: STATS.map((name) => ({ stat: { name }, base_stat: statValues[name] })),
  };
}

// ---------------------------------------------------------------------------
// Modèle Pokemon : mêmes noms de méthodes que Mongoose (find, findById, create…),
// pour que les contrôleurs s'écrivent comme dans le cours. Le stockage est SQLite.
// ---------------------------------------------------------------------------
let getRepository = () => {
  throw new Error("Stockage non connecté : appeler Pokemon.connect().");
};

const Pokemon = {
  // Relier le modèle à la base (appelé une fois par app.js)
  connect(provider) {
    getRepository = provider;
  },

  // Toutes les créations
  async find() {
    return (await getRepository()).all();
  },

  // Une création, ou null
  async findById(id) {
    return (await getRepository()).find(id);
  },

  // Valider puis enregistrer une création
  async create(data) {
    const pokemon = validatePokemon(data);
    (await getRepository()).save(pokemon);
    return pokemon;
  },

  // Valider puis remplacer une création (null si elle n'existe pas)
  async findByIdAndUpdate(id, data) {
    const repository = await getRepository();
    if (!repository.find(id)) return null;
    const pokemon = validatePokemon(data, { existingId: id });
    repository.update(pokemon);
    return pokemon;
  },

  // Supprimer une création et la retourner (null si elle n'existe pas)
  async findByIdAndDelete(id) {
    const repository = await getRepository();
    const pokemon = repository.find(id);
    if (!pokemon) return null;
    repository.delete(id);
    return pokemon;
  },

  // Importer plusieurs anciennes créations sans doublon
  async insertMany(entries) {
    const pokemons = entries.map((entry) => validatePokemon(entry, { isImport: true }));
    return (await getRepository()).import(pokemons);
  },
};

export default Pokemon;
