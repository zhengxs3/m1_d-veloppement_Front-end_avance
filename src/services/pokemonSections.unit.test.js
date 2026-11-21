import { calculateDefenses } from "./pokemonSections.js";

const relation = (doubled = [], halved = [], immune = []) => ({
  damage_relations: {
    double_damage_from: doubled.map((name) => ({ name })),
    half_damage_from: halved.map((name) => ({ name })),
    no_damage_from: immune.map((name) => ({ name })),
  },
});

/**
 * @function calculateDefenses
 */
describe("pokemonSections Unit Test Suites", () => {
  it("combine les faiblesses, résistances et immunités de deux types", () => {
    // Given : un Pokémon possède deux types avec des effets complémentaires.
    const types = [
      relation(["fire", "ice", "ground"], ["water", "grass"]),
      relation(["fire"], ["ground", "grass"], ["electric"]),
    ];
    // When : les multiplicateurs des deux types sont calculés.
    const defenses = calculateDefenses(types);
    const values = Object.fromEntries(defenses.map(({ type, multiplier }) => [type, multiplier]));
    // Then : les effets se multiplient et une immunité annule les dégâts.
    expect(values.fire).toBe(4);
    expect(values.ground).toBe(1);
    expect(values.grass).toBe(0.25);
    expect(values.electric).toBe(0);
    expect(values.water).toBe(0.5);
  });
});
