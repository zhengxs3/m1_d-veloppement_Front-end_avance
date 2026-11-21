import axios from "axios";

const STORAGE_KEY = "mon-pokedex-personnel-v1";

export const customApi = axios.create({
  baseURL: import.meta.env?.VITE_CUSTOM_API_URL || "/api",
  timeout: 15000,
});

export async function getCustomPokemons() {
  const { data } = await customApi.get("/pokemons");
  return data;
}

export async function getCustomPokemon(id) {
  const { data } = await customApi.get(`/pokemons/${encodeURIComponent(id)}`);
  return data;
}

export async function saveCustomPokemon(pokemon) {
  const { data } = await customApi.post("/pokemons", pokemon);
  return data;
}

export async function updateCustomPokemon(id, pokemon) {
  const { data } = await customApi.put(`/pokemons/${encodeURIComponent(id)}`, pokemon);
  return data;
}

export async function deleteCustomPokemon(id) {
  await customApi.delete(`/pokemons/${encodeURIComponent(id)}`);
}

// Lecture seule : les anciennes créations ne sont ni effacées ni importées sans clic.
export function getLegacyPokemons() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter(
          (item) =>
            item?.isCustom &&
            item.id &&
            item.nom &&
            Array.isArray(item.types) &&
            Array.isArray(item.stats),
        )
      : [];
  } catch {
    return [];
  }
}

export async function importLegacyPokemons(pokemons) {
  let data = [];
  for (let index = 0; index < pokemons.length; index += 100) {
    ({ data } = await customApi.post("/pokemons/import", {
      pokemons: pokemons.slice(index, index + 100),
    }));
  }
  return data;
}

export function getPokemonImage(pokemon) {
  return (
    pokemon.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon.sprites?.front_default ||
    "/pokemon-placeholder.svg"
  );
}
