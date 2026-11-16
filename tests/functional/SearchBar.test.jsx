import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "../../src/components/molecules/SearchBar";

describe("SearchBar — tests fonctionnels de la recherche", () => {
  let rechercher;
  let reinitialiser;

  beforeEach(() => {
    rechercher = jest.fn();
    reinitialiser = jest.fn();
    render(
      <SearchBar
        initialSearch=""
        handleSearch={rechercher}
        handleReset={reinitialiser}
        searchLoading={false}
      />,
    );
  });

  it("ne lance pas de recherche avant une action de l’utilisateur", () => {
    // Given : le formulaire de recherche vient d’être affiché.
    // When : l’utilisateur n’a encore effectué aucune action.
    // Then : le champ est vide et aucune recherche n’est envoyée.
    expect(screen.getByRole("textbox", { name: "Rechercher un Pokémon" })).toHaveValue("");
    expect(rechercher).not.toHaveBeenCalled();
  });

  it("transmet le nom saisi lorsque l’utilisateur soumet le formulaire", async () => {
    // Given : le formulaire est affiché et prêt à être utilisé.
    const utilisateur = userEvent.setup();

    // When : l’utilisateur saisit un nom puis clique sur Rechercher.
    await utilisateur.type(screen.getByRole("textbox", { name: "Rechercher un Pokémon" }), "pika");
    await utilisateur.click(screen.getByRole("button", { name: "Rechercher", exact: true }));

    // Then : une seule recherche est déclenchée avec le texte saisi.
    expect(rechercher).toHaveBeenCalledTimes(1);
    expect(rechercher).toHaveBeenCalledWith("pika");
  });

  it("efface le texte et réinitialise les résultats après un clic sur Réinitialiser", async () => {
    // Given : l’utilisateur a saisi un nom dans le champ de recherche.
    const utilisateur = userEvent.setup();
    const champ = screen.getByRole("textbox", { name: "Rechercher un Pokémon" });
    await utilisateur.type(champ, "pika");

    // When : il clique sur Réinitialiser.
    await utilisateur.click(screen.getByRole("button", { name: "Réinitialiser" }));

    // Then : le champ est vide et la remise à zéro est demandée.
    expect(champ).toHaveValue("");
    expect(reinitialiser).toHaveBeenCalledTimes(1);
    expect(rechercher).not.toHaveBeenCalled();
  });
});
