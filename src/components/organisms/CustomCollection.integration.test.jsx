/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CustomCollection from "./CustomCollection";
import {
  getCustomPokemons,
  getLegacyPokemons,
  importLegacyPokemons,
} from "../../services/customPokemonApi";

jest.mock("../../services/customPokemonApi", () => ({
  getCustomPokemons: jest.fn(),
  getLegacyPokemons: jest.fn(),
  importLegacyPokemons: jest.fn(),
  getPokemonImage: jest.fn(),
}));

describe("CustomCollection Integration Test Suites", () => {
  it("affiche un message français sans écran blanc si l’erreur est un objet", async () => {
    // Given : une ancienne création est disponible et la plateforme refuse l’import.
    const ancienneCreation = { id: "perso-ancien", nom: "Ancien", types: [], stats: [] };
    getCustomPokemons.mockResolvedValue([]);
    getLegacyPokemons.mockReturnValue([ancienneCreation]);
    importLegacyPokemons.mockRejectedValue({
      response: { data: { error: { code: "NOT_FOUND", message: "Not Found" } } },
    });
    const utilisateur = userEvent.setup();
    render(<CustomCollection selectedType="" query="" />);
    // When : l’utilisateur demande l’import des données locales.
    await utilisateur.click(
      await screen.findByRole("button", { name: "Importer mes anciennes créations" }),
    );
    // Then : la collection reste visible et l’erreur est rendue comme du texte.
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Import impossible. Les anciennes créations restent dans ce navigateur.",
    );
    expect(screen.getByRole("heading", { name: "Créations partagées" })).toBeInTheDocument();
    expect(importLegacyPokemons).toHaveBeenCalledWith([ancienneCreation]);
  });
});
