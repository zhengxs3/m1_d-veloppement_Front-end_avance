import api from "./api";
import { getPokemonProfile, getPokemonSection } from "./pokemonSections";

const relation = (faiblesses = [], resistances = []) => ({
  damage_relations: {
    double_damage_from: faiblesses.map((name) => ({ name })),
    half_damage_from: resistances.map((name) => ({ name })),
    no_damage_from: [],
  },
});

describe("pokemonSections Integration Test Suites", () => {
  beforeEach(() => {
    jest.spyOn(api, "get").mockRejectedValue(new Error("Ressource indisponible"));
  });

  it("conserve les autres rubriques lorsqu’un talent ne peut pas être chargé", async () => {
    // Given : un type disponible et un talent indisponible.
    api.get.mockImplementation((url) =>
      url === "/type/grass"
        ? Promise.resolve({ data: relation(["fire"], ["water"]) })
        : Promise.reject(new Error("Talent indisponible")),
    );
    // When : le profil complet est demandé.
    const resultat = await getPokemonProfile({
      types: [{ type: { name: "grass" } }],
      abilities: [{ ability: { url: "/talent-indisponible" } }],
      moves: [],
    });
    // Then : le profil reste utilisable avec les défenses et un état partiel.
    expect(resultat.partial).toBe(true);
    expect(resultat.abilities).toBeNull();
    expect(resultat.defenses.find((item) => item.type === "fire").multiplier).toBe(2);
    expect(resultat.moves).toEqual([]);
  });

  it("charge seulement la défense quand cette rubrique est demandée", async () => {
    // Given : un Pokémon possédant aussi des capacités et une chaîne d’évolution.
    api.get.mockResolvedValue({ data: relation(["electric"], ["fire"]) });
    const pokemon = {
      types: [{ type: { name: "water" } }],
      moves: [{ move: { url: "/move/non-ouverte" } }],
      speciesData: { evolution_chain: { url: "/evolution-chain/non-ouverte" } },
    };
    // When : seule la rubrique Défense est ouverte.
    const resultat = await getPokemonSection(pokemon, "defense");
    // Then : seules les données du type sont demandées.
    expect(resultat.find((item) => item.type === "electric").multiplier).toBe(2);
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith("/type/water");
  });
});
