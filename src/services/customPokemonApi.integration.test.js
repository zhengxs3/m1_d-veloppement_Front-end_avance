/**
 * @jest-environment jsdom
 */

import {
  customApi,
  deleteCustomPokemon,
  getCustomPokemon,
  getCustomPokemons,
  getLegacyPokemons,
  importLegacyPokemons,
  saveCustomPokemon,
  updateCustomPokemon,
} from "./customPokemonApi";

describe("customPokemonApi Integration Test Suites", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(customApi, "get").mockRejectedValue(new Error("Serveur indisponible"));
    jest.spyOn(customApi, "post").mockRejectedValue(new Error("Serveur indisponible"));
    jest.spyOn(customApi, "put").mockRejectedValue(new Error("Serveur indisponible"));
    jest.spyOn(customApi, "delete").mockRejectedValue(new Error("Serveur indisponible"));
  });

  it("envoie une création par POST et la récupère par son identifiant", async () => {
    // Given : une création acceptée par l’API mockée.
    const saisie = { nom: "Floréa", types: [], stats: [] };
    const creation = { ...saisie, id: "perso-florea", isCustom: true };
    customApi.post.mockResolvedValue({ data: creation });
    customApi.get.mockResolvedValueOnce({ data: [creation] });
    customApi.get.mockResolvedValueOnce({ data: creation });
    // When : la création est enregistrée, listée et consultée.
    const enregistrement = await saveCustomPokemon(saisie);
    const liste = await getCustomPokemons();
    const fiche = await getCustomPokemon(creation.id);
    // Then : les données mockées sont retournées et aucun stockage local n’est écrit.
    expect(customApi.post).toHaveBeenCalledWith("/pokemons", saisie);
    expect(enregistrement).toEqual(creation);
    expect(liste).toEqual([creation]);
    expect(fiche).toEqual(creation);
    expect(customApi.get).toHaveBeenCalledWith("/pokemons/perso-florea");
    expect(localStorage.length).toBe(0);
  });

  it("modifie une création par PUT avec son identifiant", async () => {
    // Given : une création modifiée acceptée par l’API mockée.
    const modifiee = { id: "perso-florea", nom: "Floréa 2" };
    customApi.put.mockResolvedValue({ data: modifiee });
    // When : la modification est envoyée.
    const resultat = await updateCustomPokemon("perso-florea", { nom: "Floréa 2" });
    // Then : la requête vise la bonne création et la réponse du serveur est retournée.
    expect(customApi.put).toHaveBeenCalledWith("/pokemons/perso-florea", { nom: "Floréa 2" });
    expect(resultat).toEqual(modifiee);
  });

  it("supprime une création par DELETE avec son identifiant", async () => {
    // Given : une suppression acceptée par l’API mockée.
    customApi.delete.mockResolvedValue({ status: 204 });
    // When : la suppression est demandée.
    await deleteCustomPokemon("perso-florea");
    // Then : la requête DELETE vise la bonne création.
    expect(customApi.delete).toHaveBeenCalledWith("/pokemons/perso-florea");
  });

  it("transmet l’échec du serveur lors d’une modification ou d’une suppression", async () => {
    // Given : l’API de créations est indisponible.
    // When : l’utilisateur modifie puis supprime une création.
    // Then : les deux erreurs sont transmises, sans copie locale silencieuse.
    await expect(updateCustomPokemon("perso-x", {})).rejects.toThrow("Serveur indisponible");
    await expect(deleteCustomPokemon("perso-x")).rejects.toThrow("Serveur indisponible");
    expect(localStorage.length).toBe(0);
  });

  it("ignore les anciennes données locales invalides", () => {
    // Given : un contenu local qui n’est pas du JSON valide.
    localStorage.setItem("mon-pokedex-personnel-v1", "invalide");
    // When : les anciennes créations sont lues.
    const resultat = getLegacyPokemons();
    // Then : une liste vide est retournée sans exception.
    expect(resultat).toEqual([]);
  });

  it("importe les anciennes créations sans effacer les originaux", async () => {
    // Given : une ancienne création conservée dans le navigateur.
    const ancien = { id: "perso-ancien", isCustom: true, nom: "Ancien", types: [], stats: [] };
    const original = JSON.stringify([ancien]);
    localStorage.setItem("mon-pokedex-personnel-v1", original);
    customApi.post.mockResolvedValue({ data: [ancien] });
    // When : les données sont lues et leur import est demandé.
    const resultat = await importLegacyPokemons(getLegacyPokemons());
    // Then : l’import utilise le bon endpoint et laisse les originaux intacts.
    expect(customApi.post).toHaveBeenCalledWith("/pokemons/import", { pokemons: [ancien] });
    expect(resultat).toEqual([ancien]);
    expect(localStorage.getItem("mon-pokedex-personnel-v1")).toBe(original);
  });

  it("ne remplace pas un échec du serveur par une sauvegarde locale silencieuse", async () => {
    // Given : l’API de créations est indisponible.
    // When : l’utilisateur tente d’enregistrer et de récupérer des créations.
    await expect(saveCustomPokemon({ nom: "Test" })).rejects.toThrow("Serveur indisponible");
    await expect(getCustomPokemons()).rejects.toThrow("Serveur indisponible");
    // Then : aucune donnée n’a été sauvegardée localement.
    expect(localStorage.length).toBe(0);
  });
});
