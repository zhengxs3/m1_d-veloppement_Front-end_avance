
import axios from "axios";
import { getCustomPokemons } from "./customPokemons.js";

// Créer une instance Axios.
// Adresse de base commune aux requêtes de l'API.
const api = axios.create({
  baseURL: "https://pokeapi.co/api/v2",
  timeout: 20000,
});

const resources = new Map();
// Réutiliser les ressources communes et permettre de réessayer après un échec.
export function getResource(url) {
  if (!resources.has(url)) {
    resources.set(url, api.get(url).then(({ data }) => data).catch((error) => {
      resources.delete(url);
      throw error;
    }));
  }
  return resources.get(url);
}

export const frenchName = (resource, fallback = "Non renseigné") =>
  resource.names?.find((entry) => entry.language.name === "fr")?.name || fallback;

// Récupérer une page de Pokémon.
// page : numéro de page, 1 par défaut.
// limit : nombre de Pokémon par page, 12 par défaut.
export const getPokemons = (page = 1, limit = 12) => {
  // L'API utilise un décalage pour la pagination.
  // Exemple : page 2 avec 12 Pokémon, décalage de 12.
  const offset = (page - 1) * limit;

  // Exemple de requête : /pokemon?limit=12&offset=0
  return api.get("/pokemon", {
    params: {
      limit: limit,
      offset: offset,
    },
  });
};

// Récupérer la fiche d'un Pokémon par son identifiant ou son nom.
// Exemple de requête : /pokemon/25
export const getPokemonDetails = async (id) => {
  if (String(id).startsWith("perso-")) {
    const pokemon = getCustomPokemons().find((item) => item.id === id);
    if (!pokemon) throw new Error("Pokémon personnel introuvable.");
    return { data: pokemon };
  }
  const data = await getResource(`/pokemon/${id}`);
  // Les noms français sont fournis par la fiche de l’espèce.
  const species = await getResource(data.species.url);
  return {
    data: { ...data, speciesData: species, nom: frenchName(species, "Pokémon sans nom français") },
  };
};

// Récupérer la liste complète d'un type pour le filtrage et la recherche.
export const getPokemonsByType = (type) => api.get(`/type/${type}`);

// Exporter l'instance Axios pour les autres composants.
export default api;
