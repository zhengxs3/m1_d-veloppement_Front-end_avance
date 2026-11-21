import api, { getPokemonDetails, getResource, getPokemons, getPokemonsByType } from "./api";
import { customApi } from "./customPokemonApi";

describe("api Integration Test Suites", () => {
  beforeEach(() => {
    jest.spyOn(api, "get").mockRejectedValue(new Error("Ressource indisponible"));
    jest.spyOn(customApi, "get").mockRejectedValue(new Error("Serveur indisponible"));
  });

  it("retourne le nom anglais suivi du nom français et réutilise les ressources déjà chargées", async () => {
    // Given : les réponses mockées du Pokémon et de son espèce.
    api.get.mockResolvedValueOnce({ data: { id: 1, species: { url: "/pokemon-species/1" } } });
    api.get.mockResolvedValueOnce({
      data: {
        names: [
          { language: { name: "fr" }, name: "Bulbizarre" },
          { language: { name: "en" }, name: "Bulbasaur" },
        ],
      },
    });
    // When : la même fiche est demandée deux fois.
    const premiere = await getPokemonDetails(1);
    const seconde = await getPokemonDetails(1);
    // Then : le nom est « anglais (français) » et chaque ressource est demandée une seule fois.
    expect(premiere.data.nom).toBe("Bulbasaur (Bulbizarre)");
    expect(seconde).toEqual(premiere);
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(api.get).toHaveBeenNthCalledWith(1, "/pokemon/1");
    expect(api.get).toHaveBeenNthCalledWith(2, "/pokemon-species/1");
  });

  it("n'affiche qu'un seul nom quand les noms anglais et français sont identiques", async () => {
    // Given : une espèce dont le nom est le même dans les deux langues.
    api.get.mockResolvedValueOnce({ data: { id: 243, species: { url: "/pokemon-species/243" } } });
    api.get.mockResolvedValueOnce({
      data: {
        names: [
          { language: { name: "fr" }, name: "Raikou" },
          { language: { name: "en" }, name: "Raikou" },
        ],
      },
    });
    // When : la fiche est demandée.
    const fiche = await getPokemonDetails(243);
    // Then : le nom n'est pas répété entre parenthèses.
    expect(fiche.data.nom).toBe("Raikou");
  });

  it("met en forme le nom technique quand aucune traduction anglaise n'existe", async () => {
    // Given : une espèce sans liste de noms.
    api.get.mockResolvedValueOnce({ data: { id: 122, species: { url: "/pokemon-species/122" } } });
    api.get.mockResolvedValueOnce({ data: { name: "mr-mime" } });
    // When : la fiche est demandée.
    const fiche = await getPokemonDetails(122);
    // Then : le nom technique devient un nom lisible.
    expect(fiche.data.nom).toBe("Mr Mime");
  });

  it("permet de relancer une requête après un échec", async () => {
    // Given : un premier appel en échec puis une réponse valide.
    api.get.mockRejectedValueOnce(new Error("Réseau indisponible"));
    api.get.mockResolvedValueOnce({ data: { valeur: 42 } });
    // When : la ressource est demandée, puis demandée à nouveau.
    await expect(getResource("/ressource-a-reessayer")).rejects.toThrow("Réseau indisponible");
    const resultat = await getResource("/ressource-a-reessayer");
    // Then : le second appel réussit ; l’échec n’est pas conservé dans le cache.
    expect(resultat).toEqual({ valeur: 42 });
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("réutilise le cache de pagination et de filtrage par type", async () => {
    // Given : une page et un type retournés par l’API mockée.
    api.get.mockResolvedValueOnce({ data: { count: 30, results: [] } });
    api.get.mockResolvedValueOnce({ data: { pokemon: [] } });
    // When : chaque ressource est demandée deux fois.
    await getPokemons(2, 12);
    await getPokemons(2, 12);
    await getPokemonsByType("fire");
    await getPokemonsByType("fire");
    // Then : un seul GET est effectué par ressource.
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(api.get).toHaveBeenCalledWith("/pokemon?limit=12&offset=12");
    expect(api.get).toHaveBeenCalledWith("/type/fire");
  });

  it("lit une création personnelle dans l’API des créations, pas dans PokéAPI", async () => {
    // Given : une création disponible dans l’API des créations mockée.
    const creation = { id: "perso-florea", isCustom: true, nom: "Floréa" };
    customApi.get.mockResolvedValueOnce({ data: creation });
    // When : la fiche d’un identifiant « perso-… » est demandée.
    const fiche = await getPokemonDetails(creation.id);
    // Then : seule l’API des créations est appelée.
    expect(fiche.data).toEqual(creation);
    expect(customApi.get).toHaveBeenCalledWith("/pokemons/perso-florea");
    expect(api.get).not.toHaveBeenCalled();
  });
});
