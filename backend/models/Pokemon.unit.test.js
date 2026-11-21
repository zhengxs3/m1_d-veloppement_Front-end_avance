import { isValidId, validatePokemon } from "./Pokemon.js";

const STATS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
const valide = () => ({
  nom: "  Floréa ",
  height: 7,
  weight: 69,
  types: [{ type: { name: "grass" } }],
  stats: STATS.map((name) => ({ stat: { name }, base_stat: 50 })),
});

/**
 * @function validatePokemon
 */
describe("Pokemon (model) Unit Test Suites", () => {
  it("normalise une création valide et génère un identifiant", () => {
    // Given : une création valide, avec des espaces autour du nom.
    // When : elle est validée.
    const pokemon = validatePokemon(valide());
    // Then : le nom est nettoyé, l'identifiant généré et l'illustration par défaut ajoutée.
    expect(pokemon.nom).toBe("Floréa");
    expect(pokemon.name).toBe("floréa");
    expect(pokemon.id).toMatch(/^perso-[0-9a-f]{32}$/);
    expect(pokemon.isCustom).toBe(true);
    expect(pokemon.sprites.front_default).toBe("/pokemon-placeholder.svg");
  });

  it("conserve l'identifiant lors d'une modification", () => {
    // Given : une modification d'une création existante.
    // When : elle est validée avec son identifiant.
    const pokemon = validatePokemon(valide(), { existingId: "perso-abc" });
    // Then : l'identifiant n'est pas régénéré.
    expect(pokemon.id).toBe("perso-abc");
  });

  it("reprend l'identifiant d'un import et refuse un identifiant invalide", () => {
    // Given : une ancienne création avec son identifiant.
    // When : elle est validée comme un import.
    const importee = validatePokemon({ ...valide(), id: "perso-ancien-1" }, { isImport: true });
    // Then : l'identifiant est repris ; un identifiant invalide est refusé (422).
    expect(importee.id).toBe("perso-ancien-1");
    expect(() => validatePokemon({ ...valide(), id: "x" }, { isImport: true })).toThrow(
      "Identifiant de création invalide.",
    );
  });

  it.each([
    ["nom vide", { nom: "   " }, "Le nom est obligatoire."],
    ["nom trop long", { nom: "a".repeat(61) }, "Champ invalide : nom."],
    ["taille négative", { height: -1 }, "Valeur invalide : height."],
    ["poids trop grand", { weight: 1000001 }, "Valeur invalide : weight."],
    ["type inconnu", { types: [{ type: { name: "invalid" } }] }, "Type invalide ou répété."],
    [
      "type répété",
      { types: Array(2).fill({ type: { name: "fire" } }) },
      "Type invalide ou répété.",
    ],
    ["types absents", { types: "grass" }, "Choisissez un ou deux types."],
    ["statistiques absentes", { stats: [] }, "Les six statistiques sont obligatoires."],
    [
      "statistique hors limite",
      { stats: STATS.map((name) => ({ stat: { name }, base_stat: 300 })) },
      "Statistique invalide : valeur entière de 1 à 255 attendue.",
    ],
    [
      "illustration dangereuse",
      { sprites: { front_default: "javascript:alert(1)" } },
      "L’illustration doit utiliser une URL http ou https.",
    ],
  ])("refuse une création invalide : %s", (_cas, changement, message) => {
    // Given : une création valide dont un champ est remplacé par une valeur invalide.
    // When : elle est validée.
    // Then : une erreur 422 est levée avec un message en français.
    expect.assertions(2);
    try {
      validatePokemon({ ...valide(), ...changement });
    } catch (error) {
      expect(error.status).toBe(422);
      expect(error.message).toBe(message);
    }
  });

  it("reconnaît uniquement les identifiants de la forme perso-xxxx", () => {
    // Given : plusieurs identifiants.
    // Then : seuls ceux qui commencent par « perso- » sont acceptés.
    expect(isValidId("perso-abc-123")).toBe(true);
    expect(isValidId("pikachu")).toBe(false);
    expect(isValidId("perso-")).toBe(false);
    expect(isValidId(undefined)).toBe(false);
  });
});
