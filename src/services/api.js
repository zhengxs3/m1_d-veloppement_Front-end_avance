import axios from "axios";
import { getCustomPokemon } from "./customPokemonApi.js";

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
    resources.set(
      url,
      api
        .get(url)
        .then(({ data }) => data)
        .catch((error) => {
          resources.delete(url);
          throw error;
        }),
    );
  }
  return resources.get(url);
}

export const frenchName = (resource, fallback = "Non renseigné") =>
  resource.names?.find((entry) => entry.language.name === "fr")?.name || fallback;

// Nom anglais d'un Pokémon : c'est le nom utilisé par la recherche.
// Sans traduction anglaise, le nom technique est mis en forme (« mr-mime » → « Mr Mime »).
export const englishName = (resource) =>
  resource.names?.find((entry) => entry.language.name === "en")?.name ||
  String(resource.name ?? "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// Nom affiché : « Koffing (Smogo) » = nom anglais puis nom français entre parenthèses.
// Le nom français est omis s'il est absent ou identique (« Raikou »).
export const pokemonName = (resource) => {
  const english = englishName(resource);
  const french = frenchName(resource, "");
  return french && french.toLowerCase() !== english.toLowerCase()
    ? `${english} (${french})`
    : english;
};

// Récupérer une page de Pokémon.
// page : numéro de page, 1 par défaut.
// limit : nombre de Pokémon par page, 12 par défaut.
export const getPokemons = async (page = 1, limit = 12) => {
  // L'API utilise un décalage pour la pagination.
  // Exemple : page 2 avec 12 Pokémon, décalage de 12.
  const offset = (page - 1) * limit;

  // Exemple de requête : /pokemon?limit=12&offset=0
  return { data: await getResource(`/pokemon?limit=${limit}&offset=${offset}`) };
};

// Récupérer la fiche d'un Pokémon par son identifiant ou son nom.
// Exemple de requête : /pokemon/25
export const getPokemonDetails = async (id) => {
  if (String(id).startsWith("perso-")) {
    return { data: await getCustomPokemon(id) };
  }
  const data = await getResource(`/pokemon/${id}`);
  // Les noms français sont fournis par la fiche de l’espèce.
  const species = await getResource(data.species.url);
  return {
    data: { ...data, speciesData: species, nom: pokemonName(species) },
  };
};

// Récupérer la liste complète d'un type pour le filtrage et la recherche.
export const getPokemonsByType = async (type) => ({ data: await getResource(`/type/${type}`) });

// Exporter l'instance Axios pour les autres composants.
export default api;
