/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import PokemonDetails from "./PokemonDetails";
import { getPokemonDetails } from "../services/api";
import { deleteCustomPokemon } from "../services/customPokemonApi";

jest.mock("../services/customPokemonApi", () => ({
  deleteCustomPokemon: jest.fn(),
  getPokemonImage: () => "/pokemon-placeholder.svg",
}));
jest.mock("../services/api", () => ({ getPokemonDetails: jest.fn() }));
jest.mock("../services/pokemonSections", () => ({
  getPokemonSection: jest.fn().mockResolvedValue([]),
  cleanText: (text) => text,
}));

const stats = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"].map(
  (name) => ({ stat: { name }, base_stat: 80 }),
);
const creation = {
  id: "perso-florea",
  isCustom: true,
  nom: "Floréa",
  description: "Une fleur.",
  category: "Pokémon Bourgeon",
  customAbility: "",
  height: 7,
  weight: 69,
  types: [{ type: { name: "grass" } }],
  sprites: { front_default: "/pokemon-placeholder.svg" },
  stats,
};

function AdresseActuelle() {
  const location = useLocation();
  return <output aria-label="Adresse actuelle">{location.pathname}</output>;
}

function afficherFiche(pokemon) {
  getPokemonDetails.mockResolvedValue({ data: pokemon });
  render(
    <MemoryRouter initialEntries={["/poke/" + pokemon.id]}>
      <Routes>
        <Route path="/poke/:id" element={<PokemonDetails />} />
        <Route path="/" element={<p>Accueil</p>} />
      </Routes>
      <AdresseActuelle />
    </MemoryRouter>,
  );
}

describe("PokemonDetails Integration Test Suites (suppression)", () => {
  it("demande une confirmation puis supprime la création et retourne à l’accueil", async () => {
    // Given : la fiche d’une création personnelle est affichée.
    deleteCustomPokemon.mockResolvedValue();
    afficherFiche(creation);
    const utilisateur = userEvent.setup();

    // When : l’utilisateur clique sur Supprimer, puis confirme.
    await utilisateur.click(await screen.findByRole("button", { name: "Supprimer" }));
    expect(deleteCustomPokemon).not.toHaveBeenCalled();
    await utilisateur.click(screen.getByRole("button", { name: "Oui, supprimer" }));

    // Then : l’API est appelée avec l’identifiant et l’utilisateur revient à la liste.
    expect(deleteCustomPokemon).toHaveBeenCalledWith("perso-florea");
    await waitFor(() => expect(screen.getByLabelText("Adresse actuelle")).toHaveTextContent("/"));
    expect(screen.getByText("Accueil")).toBeInTheDocument();
  });

  it("n’efface rien si l’utilisateur annule la confirmation", async () => {
    // Given : la confirmation de suppression est ouverte.
    afficherFiche(creation);
    const utilisateur = userEvent.setup();
    await utilisateur.click(await screen.findByRole("button", { name: "Supprimer" }));

    // When : l’utilisateur annule.
    await utilisateur.click(screen.getByRole("button", { name: "Annuler" }));

    // Then : aucune suppression n’est envoyée et la fiche reste affichée.
    expect(deleteCustomPokemon).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Adresse actuelle")).toHaveTextContent("/poke/perso-florea");
  });

  it("affiche une erreur et reste sur la fiche si la suppression échoue", async () => {
    // Given : l’API refuse la suppression.
    deleteCustomPokemon.mockRejectedValue(new Error("Serveur indisponible"));
    afficherFiche(creation);
    const utilisateur = userEvent.setup();
    await utilisateur.click(await screen.findByRole("button", { name: "Supprimer" }));

    // When : l’utilisateur confirme.
    await utilisateur.click(screen.getByRole("button", { name: "Oui, supprimer" }));

    // Then : un message d’erreur apparaît et la création n’a pas quitté la page.
    expect(await screen.findByRole("alert")).toHaveTextContent("Impossible de supprimer");
    expect(screen.getByLabelText("Adresse actuelle")).toHaveTextContent("/poke/perso-florea");
  });

  it("ne propose ni modification ni suppression pour un Pokémon officiel", async () => {
    // Given : la fiche d’un Pokémon du catalogue officiel.
    afficherFiche({ ...creation, id: 25, isCustom: false, nom: "Pikachu", speciesData: {} });

    // When : la fiche est chargée.
    await screen.findByRole("heading", { name: "Pikachu" });

    // Then : les actions de modification et de suppression sont absentes.
    expect(screen.queryByRole("button", { name: "Supprimer" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Modifier" })).not.toBeInTheDocument();
  });
});
