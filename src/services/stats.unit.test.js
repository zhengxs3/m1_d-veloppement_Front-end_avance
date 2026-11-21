import { maximumStat } from "./stats.js";

/**
 * @function maximumStat
 */
describe("stats Unit Test Suites", () => {
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
