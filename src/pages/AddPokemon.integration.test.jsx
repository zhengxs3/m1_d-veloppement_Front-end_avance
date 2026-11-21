/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import AddPokemon from "./AddPokemon";
import {
  getCustomPokemon,
  saveCustomPokemon,
  updateCustomPokemon,
} from "../services/customPokemonApi";

jest.mock("../services/customPokemonApi", () => ({
  getCustomPokemon: jest.fn(),
  saveCustomPokemon: jest.fn(),
  updateCustomPokemon: jest.fn(),
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

async function remplirFormulaire(utilisateur) {
  await utilisateur.type(screen.getByLabelText("Nom du Pokémon *"), "Floréa");
  await utilisateur.type(screen.getByLabelText("Taille (m) *"), "0.7");
  await utilisateur.type(screen.getByLabelText("Poids (kg) *"), "6.9");
}

describe("AddPokemon Integration Test Suites (ajout)", () => {
  beforeEach(() => {
    saveCustomPokemon.mockReset();
    render(
      <MemoryRouter initialEntries={["/add"]}>
        <AddPokemon />
        <AdresseActuelle />
      </MemoryRouter>,
    );
  });

  it("n’affiche pas de message d’erreur à l’ouverture du formulaire", () => {
    // Given : le formulaire vient d’être affiché.
    // When : aucune saisie et aucun envoi n’ont été effectués.
    // Then : aucune erreur n’est affichée et aucun appel API n’est effectué.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(saveCustomPokemon).not.toHaveBeenCalled();
  });

  it("reste affiché si la plateforme renvoie une erreur sous forme d’objet", async () => {
    // Given : Vercel retourne une erreur structurée quand le backend n’est pas configuré.
    saveCustomPokemon.mockRejectedValue({
      response: { status: 404, data: { error: { code: "NOT_FOUND", message: "Not Found" } } },
    });
    const utilisateur = userEvent.setup();
    await remplirFormulaire(utilisateur);
    // When : l’utilisateur soumet le formulaire.
    await utilisateur.click(screen.getByRole("button", { name: /Ajouter à mon Pokédex/ }));
    // Then : un texte français remplace l’objet, sans faire disparaître la page.
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible d’enregistrer ce Pokémon. Vérifiez que le serveur de créations est accessible, puis réessayez.",
    );
    expect(screen.getByLabelText("Nom du Pokémon *")).toHaveValue("Floréa");
    expect(screen.getByLabelText("Adresse actuelle")).toHaveTextContent("/add");
    expect(screen.getByRole("button", { name: /Ajouter à mon Pokédex/ })).toBeEnabled();
  });

  it("enregistre les données valides puis navigue vers la fiche créée", async () => {
    // Given : l’API simulée accepte un Pokémon et retourne son identifiant.
    saveCustomPokemon.mockResolvedValue({ id: "perso-florea", nom: "Floréa" });
    const utilisateur = userEvent.setup();
    await remplirFormulaire(utilisateur);

    // When : l’utilisateur envoie le formulaire.
    await utilisateur.click(screen.getByRole("button", { name: /Ajouter à mon Pokédex/ }));

    // Then : le service reçoit les valeurs converties et la route devient celle de la fiche.
    expect(saveCustomPokemon).toHaveBeenCalledTimes(1);
    expect(saveCustomPokemon).toHaveBeenCalledWith(
      expect.objectContaining({
        nom: "Floréa",
        height: 7,
        weight: 69,
        types: [{ type: { name: "grass" } }],
        stats: expect.arrayContaining([
          { stat: { name: "hp" }, base_stat: 50 },
          { stat: { name: "speed" }, base_stat: 50 },
        ]),
      }),
    );
    await waitFor(() => {
      expect(screen.getByLabelText("Adresse actuelle")).toHaveTextContent("/poke/perso-florea");
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("affiche l’erreur du serveur et conserve les saisies si l’enregistrement échoue", async () => {
    // Given : un formulaire rempli et une API simulée qui refuse l’enregistrement.
    saveCustomPokemon.mockRejectedValue({
      response: { data: { error: "Stockage indisponible." } },
    });
    const utilisateur = userEvent.setup();
    await remplirFormulaire(utilisateur);

    // When : l’utilisateur tente d’ajouter le Pokémon.
    await utilisateur.click(screen.getByRole("button", { name: /Ajouter à mon Pokédex/ }));

    // Then : l’erreur est visible, la saisie est conservée et aucune navigation n’a lieu.
    expect(await screen.findByRole("alert")).toHaveTextContent("Stockage indisponible.");
    expect(screen.getByLabelText("Nom du Pokémon *")).toHaveValue("Floréa");
    expect(screen.getByLabelText("Adresse actuelle")).toHaveTextContent("/add");
    expect(screen.getByRole("button", { name: /Ajouter à mon Pokédex/ })).toBeEnabled();
  });
});

describe("AddPokemon Integration Test Suites (modification)", () => {
  beforeEach(() => {
    getCustomPokemon.mockResolvedValue(creation);
    updateCustomPokemon.mockResolvedValue({ ...creation, nom: "Floréa 2" });
    render(
      <MemoryRouter initialEntries={["/poke/perso-florea/edit"]}>
        <Routes>
          <Route path="/poke/:id/edit" element={<AddPokemon />} />
          <Route path="/poke/:id" element={<p>Fiche</p>} />
        </Routes>
        <AdresseActuelle />
      </MemoryRouter>,
    );
  });

  it("pré-remplit le formulaire avec les valeurs de la création", async () => {
    // Given : une création existante est chargée depuis l’API simulée.
    // When : la page de modification s’affiche.
    const nom = await screen.findByLabelText("Nom du Pokémon *");
    // Then : les champs reprennent les valeurs enregistrées (taille et poids en m et kg).
    expect(nom).toHaveValue("Floréa");
    expect(screen.getByLabelText("Taille (m) *")).toHaveValue(0.7);
    expect(screen.getByLabelText("Poids (kg) *")).toHaveValue(6.9);
    expect(getCustomPokemon).toHaveBeenCalledWith("perso-florea");
  });

  it("envoie la modification avec l’identifiant puis retourne à la fiche", async () => {
    // Given : le formulaire est pré-rempli et l’utilisateur change le nom.
    const utilisateur = userEvent.setup();
    const nom = await screen.findByLabelText("Nom du Pokémon *");
    await utilisateur.clear(nom);
    await utilisateur.type(nom, "Floréa 2");

    // When : il enregistre les modifications.
    await utilisateur.click(screen.getByRole("button", { name: "Enregistrer les modifications" }));

    // Then : le service reçoit l’identifiant et le nouveau nom, puis la fiche s’affiche.
    expect(updateCustomPokemon).toHaveBeenCalledWith(
      "perso-florea",
      expect.objectContaining({ nom: "Floréa 2", height: 7, weight: 69 }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Adresse actuelle")).toHaveTextContent("/poke/perso-florea"),
    );
  });
});
