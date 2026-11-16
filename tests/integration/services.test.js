import api, {
  getPokemonDetails,
  getResource,
  getPokemons,
  getPokemonsByType,
} from "../../src/services/api";
import {
  customApi,
  getCustomPokemons,
  saveCustomPokemon,
  getLegacyPokemons,
  importLegacyPokemons,
} from "../../src/services/customPokemonApi";
import { getPokemonProfile, getPokemonSection } from "../../src/services/pokemonSections";

const relation = (faiblesses = [], resistances = []) => ({
  damage_relations: {
    double_damage_from: faiblesses.map((name) => ({ name })),
    half_damage_from: resistances.map((name) => ({ name })),
    no_damage_from: [],
  },
});

describe("Services API — intégration avec des réponses HTTP simulées", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(api, "get").mockRejectedValue(new Error("Ressource indisponible"));
    jest.spyOn(customApi, "get").mockRejectedValue(new Error("Serveur indisponible"));
    jest.spyOn(customApi, "post").mockRejectedValue(new Error("Serveur indisponible"));
  });

  it("retourne le nom français mocké et réutilise les ressources déjà chargées", async () => {
    // Given : les réponses mockées du Pokémon et de son espèce.
    api.get.mockResolvedValueOnce({ data: { id: 1, species: { url: "/pokemon-species/1" } } });
    api.get.mockResolvedValueOnce({
      data: { names: [{ language: { name: "fr" }, name: "Bulbizarre" }] },
    });
    // When : la même fiche est demandée deux fois.
    const premiere = await getPokemonDetails(1);
    const seconde = await getPokemonDetails(1);
    // Then : le nom français est retourné et chaque ressource est demandée une seule fois.
    expect(premiere.data.nom).toBe("Bulbizarre");
    expect(seconde).toEqual(premiere);
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(api.get).toHaveBeenNthCalledWith(1, "/pokemon/1");
    expect(api.get).toHaveBeenNthCalledWith(2, "/pokemon-species/1");
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
    const fiche = await getPokemonDetails(creation.id);
    // Then : les données mockées sont retournées et aucun stockage local n’est écrit.
    expect(customApi.post).toHaveBeenCalledWith("/pokemons", saisie);
    expect(enregistrement).toEqual(creation);
    expect(liste).toEqual([creation]);
    expect(fiche.data).toEqual(creation);
    expect(customApi.get).toHaveBeenCalledWith("/pokemons/perso-florea");
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
