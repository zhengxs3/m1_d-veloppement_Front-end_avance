/**
 * @jest-environment jsdom
 */

import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar";

/**
 * @function Navbar
 */
describe("Navbar Snapshot Test Suites", () => {
  it("doit correspondre au snapshot du menu de navigation", () => {
    // Given : le menu est affiché dans un routeur.
    // When : le HTML produit est lu.
    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );
    // Then : il correspond au snapshot enregistré.
    expect(container.innerHTML).toMatchInlineSnapshot(
      `"<nav class="bg-violet-100 text-violet-900 p-4 shadow-md"><div class="max-w-6xl mx-auto flex flex-wrap gap-4 justify-between items-center"><a class="text-2xl font-bold" href="/" data-discover="true">Mon Pokédex</a><div class="flex gap-4 items-center"><a class="hover:text-violet-700" href="/" data-discover="true">Accueil</a><a class="action-button" href="/add" data-discover="true">+ Ajouter un Pokémon</a></div></div></nav>"`,
    );
  });
});
