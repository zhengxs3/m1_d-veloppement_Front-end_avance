import { frenchName, getResource } from "./api.js";
import { TYPE_LABELS } from "../data/translations.js";

const frenchText = (entries = []) => entries.find((entry) => entry.language.name === "fr");
export const cleanText = (text = "") => text.replace(/[\n\f\r]+/g, " ");

// Multiplier les effets des deux types, notamment pour les immunités.
export function calculateDefenses(typeResources) {
  const multipliers = Object.fromEntries(Object.keys(TYPE_LABELS).filter((type) => !["unknown", "stellar"].includes(type)).map((type) => [type, 1]));
  for (const resource of typeResources) {
    for (const [relation, factor] of [["double_damage_from", 2], ["half_damage_from", 0.5], ["no_damage_from", 0]]) {
      for (const type of resource.damage_relations[relation]) multipliers[type.name] *= factor;
    }
  }
  return Object.entries(multipliers).map(([type, multiplier]) => ({ type, multiplier }));
}

async function getEvolution(chainUrl) {
  if (!chainUrl) return [];
  const { chain } = await getResource(chainUrl);
  const nodes = [];
  function visit(node, parent = null) {
    nodes.push({ node, parent });
    node.evolves_to.forEach((child) => visit(child, node.species.name));
  }
  visit(chain);
  return Promise.all(nodes.map(async ({ node, parent }) => {
    const species = await getResource(node.species.url);
    const details = node.evolution_details[0];
    const item = details?.item ? await getResource(details.item.url) : null;
    const condition = details?.min_level ? `Niveau ${details.min_level}` :
      item ? frenchName(item) : details?.min_happiness ? "Bonheur élevé" :
        details?.trigger.name === "trade" ? "Échange" : parent ? "Conditions particulières" : "Forme de base";
    return { id: species.id, key: node.species.name, parent, nom: frenchName(species), condition };
  }));
}

export async function getPokemonProfile(pokemon) {
  const species = pokemon.speciesData;
  const tasks = [
    Promise.all((pokemon.abilities || []).map(async (entry) => {
      const ability = await getResource(entry.ability.url);
      return { nom: frenchName(ability), hidden: entry.is_hidden,
        description: cleanText(frenchText(ability.flavor_text_entries)?.flavor_text || "Description indisponible en français.") };
    })),
    Promise.all(pokemon.types.map((entry) => getResource(`/type/${entry.type.name}`))).then(calculateDefenses),
    getEvolution(species?.evolution_chain?.url),
    Promise.all((pokemon.moves || []).slice(0, 12).map(async (entry) => {
      const move = await getResource(entry.move.url);
      return { id: move.id, nom: frenchName(move), type: move.type.name,
        power: move.power, accuracy: move.accuracy, pp: move.pp,
        description: cleanText(frenchText(move.flavor_text_entries)?.flavor_text || "Description indisponible en français.") };
    })),
    Promise.all((species?.egg_groups || []).map(async (entry) => frenchName(await getResource(entry.url)))),
  ];
  // Une rubrique indisponible ne doit pas masquer les autres informations.
  const results = await Promise.allSettled(tasks);
  const values = results.map((result) => result.status === "fulfilled" ? result.value : null);
  return { abilities: values[0], defenses: values[1], evolutions: values[2], moves: values[3], eggGroups: values[4], partial: results.some((result) => result.status === "rejected") };
}
