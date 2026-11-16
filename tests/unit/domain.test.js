import { maximumStat } from "../../src/services/stats.js";
import { calculateDefenses } from "../../src/services/pokemonSections.js";

const relation = (doubled = [], halved = [], immune = []) => ({
  damage_relations: {
    double_damage_from: doubled.map((name) => ({ name })),
    half_damage_from: halved.map((name) => ({ name })),
    no_damage_from: immune.map((name) => ({ name })),
  },
});

describe("calculateDefenses — tests unitaires des types", () => {
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

describe("maximumStat — tests unitaires des statistiques", () => {
  it("retourne 294 PV pour une statistique de base de 45", () => {
    // Given : une statistique de base de 45 PV.
    const base = 45;
    // When : le maximum des PV au niveau 100 est calculé.
    const resultat = maximumStat(base, "hp");
    // Then : la fonction retourne 294.
    expect(resultat).toBe(294);
  });

  it("applique une nature favorable à l’attaque", () => {
    // Given : une attaque de base de 49.
    const base = 49;
    // When : le maximum de l’attaque est calculé.
    const resultat = maximumStat(base, "attack");
    // Then : la fonction retourne 216.
    expect(resultat).toBe(216);
  });

  it("conserve un seul PV pour le cas particulier d’une base à 1 PV", () => {
    // Given : un Pokémon dont la statistique de base vaut 1 PV.
    // When : le maximum est calculé.
    const resultat = maximumStat(1, "hp");
    // Then : le cas particulier conserve exactement 1 PV.
    expect(resultat).toBe(1);
  });
});
