/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import TypeBadge from "./TypeBadge";

function AdresseActuelle() {
  const location = useLocation();
  return <output aria-label="Adresse actuelle">{location.pathname + location.search}</output>;
}

const afficher = (badge) =>
  render(
    <MemoryRouter initialEntries={["/poke/25"]}>
      {badge}
      <AdresseActuelle />
    </MemoryRouter>,
  );

/**
 * @function TypeBadge
 */
describe("TypeBadge Integration Test Suites", () => {
  it("affiche un simple texte quand l’étiquette n’est pas cliquable", () => {
    // Given : une étiquette sans l’option linked.
    afficher(<TypeBadge type="fire" />);
    // Then : le libellé français est affiché mais il n’y a aucun lien.
    expect(screen.getByText("Feu")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("devient un lien vers la liste des Pokémon de ce type", () => {
    // Given : une étiquette cliquable de type Feu.
    afficher(<TypeBadge type="fire" linked />);
    // Then : le lien explique son action et pointe vers le filtre du catalogue.
    const lien = screen.getByRole("link", { name: "Voir les Pokémon de type Feu" });
    expect(lien).toHaveAttribute("href", "/?type=fire");
    expect(lien).toHaveClass("type-badge", "type-fire", "type-link");
  });

  it("ouvre la page d’accueil filtrée par type au clic", async () => {
    // Given : une étiquette cliquable de type Plante sur une fiche.
    afficher(<TypeBadge type="grass" linked />);
    // When : l’utilisateur clique dessus.
    await userEvent.setup().click(screen.getByRole("link", { name: /type Plante/ }));
    // Then : l’adresse devient celle du filtre « grass ».
    expect(screen.getByLabelText("Adresse actuelle")).toHaveTextContent("/?type=grass");
  });

  it("ne rend jamais cliquable un type sans page de catalogue", () => {
    // Given : des types inconnus ou sans catalogue, même avec linked.
    afficher(
      <>
        <TypeBadge type="unknown" linked />
        <TypeBadge type="stellar" linked />
        <TypeBadge type="inventé" linked />
      </>,
    );
    // Then : aucun lien n’est créé.
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
