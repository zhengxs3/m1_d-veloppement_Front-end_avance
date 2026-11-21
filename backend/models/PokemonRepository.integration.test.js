import { randomBytes } from "node:crypto";
import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import PokemonRepository from "./PokemonRepository.js";

const creation = (id, nom = "Floréa") => ({ id, isCustom: true, nom });

/**
 * @function PokemonRepository
 */
describe("PokemonRepository Integration Test Suites (base SQLite)", () => {
  let repository;

  beforeEach(async () => {
    repository = await PokemonRepository.open(":memory:");
  });

  afterEach(() => repository.close());

  it("démarre avec une base vide", () => {
    // Given : une base en mémoire qui vient d'être ouverte.
    // Then : aucune création n'est enregistrée.
    expect(repository.all()).toEqual([]);
  });

  it("enregistre puis retrouve une création par son identifiant", () => {
    // Given : une création enregistrée.
    repository.save(creation("perso-1"));
    // When : elle est recherchée.
    // Then : elle est retrouvée telle quelle ; un identifiant inconnu donne null.
    expect(repository.find("perso-1")).toEqual(creation("perso-1"));
    expect(repository.find("perso-inconnu")).toBeNull();
  });

  it("liste les créations de la plus récente à la plus ancienne", () => {
    // Given : trois créations enregistrées l'une après l'autre.
    ["perso-1", "perso-2", "perso-3"].forEach((id) => repository.save(creation(id)));
    // Then : la dernière enregistrée apparaît en premier.
    expect(repository.all().map(({ id }) => id)).toEqual(["perso-3", "perso-2", "perso-1"]);
  });

  it("modifie une création existante sans en créer une autre", () => {
    // Given : une création enregistrée.
    repository.save(creation("perso-1"));
    // When : elle est modifiée, puis une création inexistante est modifiée.
    const modifiee = repository.update(creation("perso-1", "Floréa 2"));
    const absente = repository.update(creation("perso-absent"));
    // Then : seule la première est modifiée et rien n'est dupliqué.
    expect(modifiee).toBe(true);
    expect(absente).toBe(false);
    expect(repository.find("perso-1").nom).toBe("Floréa 2");
    expect(repository.all()).toHaveLength(1);
  });

  it("supprime une création existante et signale une création absente", () => {
    // Given : deux créations enregistrées.
    repository.save(creation("perso-1"));
    repository.save(creation("perso-2"));
    // When : l'une est supprimée, puis la même est supprimée une seconde fois.
    const premiere = repository.delete("perso-1");
    const seconde = repository.delete("perso-1");
    // Then : la première suppression réussit, la seconde non, et l'autre création reste.
    expect(premiere).toBe(true);
    expect(seconde).toBe(false);
    expect(repository.all().map(({ id }) => id)).toEqual(["perso-2"]);
  });

  it("importe plusieurs créations sans doublon", () => {
    // Given : une création déjà présente.
    repository.save(creation("perso-1", "Originale"));
    // When : un lot contenant cette création et une nouvelle est importé deux fois.
    const lot = [creation("perso-1", "Copie"), creation("perso-2")];
    repository.import(lot);
    const resultat = repository.import(lot);
    // Then : la création existante est conservée et il n'y a pas de doublon.
    expect(resultat).toHaveLength(2);
    expect(repository.find("perso-1").nom).toBe("Originale");
  });
});

describe("PokemonRepository Integration Test Suites (fichier SQLite)", () => {
  const chemin = join(tmpdir(), `pokedex-repo-${randomBytes(8).toString("hex")}.sqlite`);

  afterAll(() => {
    for (const fichier of [chemin, `${chemin}.tmp`]) if (existsSync(fichier)) rmSync(fichier);
  });

  it("conserve les créations dans le fichier après fermeture et réouverture", async () => {
    // Given : une création enregistrée dans un fichier, puis la base est fermée.
    const premiere = await PokemonRepository.open(chemin);
    premiere.save(creation("perso-1"));
    premiere.update(creation("perso-1", "Floréa 2"));
    premiere.save(creation("perso-2"));
    premiere.delete("perso-2");
    premiere.close();

    // When : le même fichier est rouvert.
    const seconde = await PokemonRepository.open(chemin);

    // Then : l'état final est retrouvé et aucun fichier temporaire ne reste.
    expect(seconde.all()).toEqual([creation("perso-1", "Floréa 2")]);
    expect(existsSync(`${chemin}.tmp`)).toBe(false);
    seconde.close();
  });

  it("n'écrit aucun fichier pour une base en mémoire", async () => {
    // Given : une base en mémoire utilisée puis fermée.
    const memoire = await PokemonRepository.open(":memory:");
    memoire.save(creation("perso-1"));
    memoire.close();
    // Then : aucun fichier « :memory: » n'a été créé.
    expect(existsSync(":memory:")).toBe(false);
  });
});
