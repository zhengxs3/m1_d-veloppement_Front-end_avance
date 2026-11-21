import { useState } from "react";

function SearchBar({
  initialSearch,
  handleSearch, // Lancer la recherche
  handleReset, // Réinitialiser la recherche
  searchLoading, // Indiquer une recherche en cours
}) {
  const [search, setSearch] = useState(initialSearch);
  return (
    <div className="mb-8">
      {/* Formulaire de recherche */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSearch(search);
        }}
        className="flex flex-col sm:flex-row gap-3 mb-2"
      >
        {/* Accepter un nom partiel ; la page d'accueil effectue la recherche. */}
        <input
          type="text"
          aria-label="Rechercher un Pokémon"
          aria-describedby="search-hint"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un Pokémon (ex : pika)"
          className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3
                   focus:outline-none focus:ring-2 focus:ring-violet-300"
        />

        {/* Bouton de recherche */}
        <button
          type="submit"
          disabled={searchLoading}
          className="bg-violet-100 text-violet-900 px-6 py-3 rounded-lg
                   hover:bg-violet-200 transition
                   disabled:bg-slate-100 disabled:text-slate-400"
        >
          {searchLoading ? "Recherche..." : "Rechercher"}
        </button>

        {/* Bouton de réinitialisation */}
        <button
          type="button"
          onClick={() => {
            setSearch("");
            handleReset();
          }}
          className="border border-gray-300 px-5 py-3 rounded-lg
                   hover:bg-gray-100 transition"
        >
          Réinitialiser
        </button>
      </form>
      {/* Les noms affichés sont les noms anglais de PokéAPI, utilisés par la recherche. */}
      <p id="search-hint" className="text-sm text-gray-500">
        La recherche se fait par nom anglais (ex. : pikachu, charizard).
      </p>
    </div>
  );
}

// Exporter le composant de recherche
export default SearchBar;
