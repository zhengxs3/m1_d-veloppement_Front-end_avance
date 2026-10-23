const STORAGE_KEY = "mon-pokedex-personnel-v1";

// Conserver les créations dans le navigateur, sans modifier le catalogue officiel.
export function getCustomPokemons() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((item) => item?.isCustom && item.id && item.nom && Array.isArray(item.types) && Array.isArray(item.stats)) : [];
  } catch {
    return [];
  }
}

export function saveCustomPokemon(pokemon) {
  const entry = { ...pokemon, id: `perso-${crypto.randomUUID()}`, isCustom: true };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...getCustomPokemons()]));
  return entry;
}

export function getPokemonImage(pokemon) {
  return pokemon.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon.sprites?.front_default || "/pokemon-placeholder.svg";
}
