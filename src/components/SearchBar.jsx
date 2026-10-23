
function SearchBar({
  search,         // Texte du champ de recherche
  setSearch,      // Modifier le texte saisi
  handleSearch,   // Lancer la recherche
  handleReset,    // Réinitialiser la recherche
  searchLoading,  // Indiquer une recherche en cours
}) {
  return (
    // Formulaire de recherche
    <form
      onSubmit={handleSearch}
      className="flex flex-col sm:flex-row gap-3 mb-8"
    >
      {/* Accepter un nom partiel ; la page d'accueil effectue la recherche. */}
      <input
        type="text"
        aria-label="Rechercher un Pokémon"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un Pokémon (ex : pika)"
        className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3
                   focus:outline-none focus:ring-2 focus:ring-emerald-300"
      />

      {/* Bouton de recherche */}
      <button
        type="submit"
        disabled={searchLoading}
        className="bg-emerald-100 text-emerald-900 px-6 py-3 rounded-lg
                   hover:bg-emerald-200 transition
                   disabled:bg-slate-100 disabled:text-slate-400"
      >
        {searchLoading ? "Recherche..." : "Rechercher"}
      </button>

      {/* Bouton de réinitialisation */}
      <button
        type="button"
        onClick={handleReset}
        className="border border-gray-300 px-5 py-3 rounded-lg
                   hover:bg-gray-100 transition"
      >
        Réinitialiser
      </button>
    </form>
  );
}

// Exporter le composant de recherche
export default SearchBar;
