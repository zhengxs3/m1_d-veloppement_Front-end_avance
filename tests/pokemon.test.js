import test from "node:test";
import assert from "node:assert/strict";
import api, { getPokemonDetails, getResource } from "../src/services/api.js";
import { getCustomPokemons, saveCustomPokemon } from "../src/services/customPokemons.js";
import { calculateDefenses, getPokemonProfile } from "../src/services/pokemonProfile.js";
import { maximumStat } from "../src/services/stats.js";

const memory = new Map();
globalThis.localStorage = { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
const requests = new Map();
const fixtures = {
  "/pokemon/1": { id: 1, species: { url: "/pokemon-species/1" } },
  "/pokemon-species/1": { id: 1, names: [{ language: { name: "fr" }, name: "Bulbizarre" }] },
};
api.defaults.adapter = async (config) => {
  requests.set(config.url, (requests.get(config.url) || 0) + 1);
  if (!fixtures[config.url]) throw new Error("Ressource indisponible");
  return { data: fixtures[config.url], status: 200, statusText: "OK", headers: {}, config };
};

test("Les noms français et les ressources sont réutilisés", async () => {
  assert.equal((await getPokemonDetails(1)).data.nom, "Bulbizarre");
  await getPokemonDetails(1);
  assert.equal(requests.get("/pokemon/1"), 1);
  assert.equal(requests.get("/pokemon-species/1"), 1);
});

test("Une requête échouée peut être relancée", async () => {
  await assert.rejects(getResource("/ressource-a-reessayer"));
  fixtures["/ressource-a-reessayer"] = { value: 42 };
  assert.equal((await getResource("/ressource-a-reessayer")).value, 42);
  assert.equal(requests.get("/ressource-a-reessayer"), 2);
});

test("Les créations sont sauvegardées et accessibles par leur identifiant", async () => {
  const pokemon = { nom: "Floréa", types: [{ type: { name: "grass" } }], stats: [{ stat: { name: "hp" }, base_stat: 60 }] };
  const first = saveCustomPokemon(pokemon);
  const second = saveCustomPokemon(pokemon);
  assert.notEqual(first.id, second.id);
  assert.deepEqual(getCustomPokemons().map((entry) => entry.id), [second.id, first.id]);
  assert.equal((await getPokemonDetails(first.id)).data.nom, "Floréa");
  await assert.rejects(getPokemonDetails("perso-inexistant"));
});

test("Un stockage invalide ne fait pas planter la liste", () => {
  memory.set("mon-pokedex-personnel-v1", "invalide");
  assert.deepEqual(getCustomPokemons(), []);
  memory.set("mon-pokedex-personnel-v1", "{}");
  assert.deepEqual(getCustomPokemons(), []);
  memory.clear();
});

const relation = (doubled = [], halved = [], immune = []) => ({ damage_relations: {
  double_damage_from: doubled.map((name) => ({ name })),
  half_damage_from: halved.map((name) => ({ name })),
  no_damage_from: immune.map((name) => ({ name })),
} });

test("Les faiblesses doubles, résistances et immunités se combinent", () => {
  const defenses = calculateDefenses([
    relation(["fire", "ice", "ground"], ["water", "grass"]),
    relation(["fire"], ["ground", "grass"], ["electric"]),
  ]);
  const values = Object.fromEntries(defenses.map(({ type, multiplier }) => [type, multiplier]));
  assert.equal(values.fire, 4);
  assert.equal(values.ground, 1);
  assert.equal(values.grass, 0.25);
  assert.equal(values.electric, 0);
  assert.equal(values.water, 0.5);
});

test("Une rubrique en échec ne bloque pas les autres informations", async () => {
  fixtures["/type/grass"] = relation(["fire"], ["water"]);
  const result = await getPokemonProfile({ types: [{ type: { name: "grass" } }], abilities: [{ ability: { url: "/talent-indisponible" } }], moves: [] });
  assert.equal(result.partial, true);
  assert.equal(result.abilities, null);
  assert.equal(result.defenses.find((entry) => entry.type === "fire").multiplier, 2);
  assert.deepEqual(result.moves, []);
});

test("Les maxima distinguent les PV, la nature favorable et le cas à 1 PV", () => {
  assert.equal(maximumStat(45, "hp"), 294);
  assert.equal(maximumStat(49, "attack"), 216);
  assert.equal(maximumStat(65, "special-attack"), 251);
  assert.equal(maximumStat(1, "hp"), 1);
  assert.equal(maximumStat(255, "hp"), 714);
});
