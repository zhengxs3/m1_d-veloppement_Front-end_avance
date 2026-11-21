/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "./Pagination";

/**
 * @function Pagination
 */
describe("Pagination Integration Test Suites", () => {
  const afficher = (props = {}) => {
    const actions = { onPrev: jest.fn(), onNext: jest.fn() };
    render(<Pagination page={1} disablePrev={false} disableNext={false} {...actions} {...props} />);
    return actions;
  };

  it("affiche le numéro de la page courante", () => {
    // Given : la page 3 est affichée.
    afficher({ page: 3 });
    // Then : le numéro de page est visible.
    expect(screen.getByText("Page 3")).toBeInTheDocument();
  });

  it("désactive la page précédente sur la première page", () => {
    // Given : la première page, sans page précédente.
    afficher({ page: 1, disablePrev: true });
    // Then : « Page précédente » est désactivé et « Page suivante » reste actif.
    expect(screen.getByRole("button", { name: /Page précédente/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Page suivante/ })).toBeEnabled();
  });

  it("appelle les actions précédente et suivante au clic", async () => {
    // Given : une page intermédiaire.
    const { onPrev, onNext } = afficher({ page: 2 });
    const utilisateur = userEvent.setup();
    // When : l’utilisateur clique sur chaque bouton.
    await utilisateur.click(screen.getByRole("button", { name: /Page suivante/ }));
    await utilisateur.click(screen.getByRole("button", { name: /Page précédente/ }));
    // Then : chaque action est appelée une fois.
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it("désactive la page suivante sur la dernière page", () => {
    // Given : la dernière page.
    afficher({ page: 9, disableNext: true });
    // Then : « Page suivante » est désactivé.
    expect(screen.getByRole("button", { name: /Page suivante/ })).toBeDisabled();
  });
});
