import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getPokemons, getPokemonDetails, getPokemonsByType } from "../services/api";
import PokeCard from "../components/molecules/PokeCard";
import Pagination from "../components/molecules/Pagination";
import SearchBar from "../components/molecules/SearchBar";
import TypeFilter from "../components/molecules/TypeFilter";
import { TYPE_LABELS } from "../data/translations";
import CustomCollection from "../components/organisms/CustomCollection";

// Afficher 12 Pokémon par page, y compris dans les résultats de recherche.
const LIMIT = 12;

function Home() {
  // Conserver le type dans l'URL pour la navigation et le rechargement.
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedType = searchParams.get("type") || "";
  const [pokemons, setPokemons] = useState([]);
  const rawPage = Number(searchParams.get("page") || 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Ignorer les anciennes requêtes après une recherche ou un changement de page.
    let cancelled = false;

    const fetchPokemons = async () => {
      setLoading(true);
      setError(null);

      try {
        let results;
        let count;

        if (selectedType) {
          // Filtrer la liste complète du type avant la pagination, y compris les Pokémon à deux types.
          const response = await getPokemonsByType(selectedType);
          const matches = response.data.pokemon
            .map((entry) => entry.pokemon)
            .filter((pokemon) => pokemon.name.toLowerCase().includes(query));
          count = matches.length;
          results = matches.slice((page - 1) * LIMIT, page * LIMIT);
        } else if (query) {
          // Charger tous les noms pour rechercher au-delà de la page actuelle.
          const summary = await getPokemons(1, 1);
          const response = await getPokemons(1, summary.data.count);
          const matches = response.data.results.filter((pokemon) =>
            pokemon.name.toLowerCase().includes(query),
          );
          count = matches.length;
          // Charger uniquement les fiches de la page actuelle.
          results = matches.slice((page - 1) * LIMIT, page * LIMIT);
        } else {
          const response = await getPokemons(page, LIMIT);
          count = response.data.count;
          results = response.data.results;
        }

        if (cancelled) return;

        const details = await Promise.all(
          results.map(async (pokemon) => {
            const { data } = await getPokemonDetails(pokemon.name);
            return {
              id: data.id,
              nom: data.nom,
              image:
                data.sprites.other?.["official-artwork"]?.front_default ||
                data.sprites.front_default,
              element: data.types
                .map((type) => TYPE_LABELS[type.type.name] || "Inconnu")
                .join(", "),
            };
          }),
        );

        if (!cancelled) {
          setPokemons(details);
          setTotal(count);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Erreur lors du chargement des Pokémon.");
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPokemons();
    return () => {
      cancelled = true;
    };
  }, [page, query, selectedType]);

  const updateFilters = (nextPage, nextQuery = query, nextType = selectedType) => {
    const params = {};
    if (nextType) params.type = nextType;
    if (nextQuery) params.q = nextQuery;
    if (nextPage > 1) params.page = String(nextPage);
    setSearchParams(params);
  };

  const handleTypeSelect = (type) => updateFilters(1, "", type);
  const handleSearch = (search) => updateFilters(1, search.trim().toLowerCase());
  const handleReset = () => updateFilters(1, "");

  return (
    <div>
      <div className="home-heading">
        <div>
          <span className="eyebrow">EXPLORER ET COLLECTIONNER</span>
          <h1 className="text-3xl font-bold">Liste des Pokémon</h1>
        </div>
      </div>

      {/* Afficher les Pokémon du type sélectionné. */}
      <TypeFilter selectedType={selectedType} onSelect={handleTypeSelect} />

      {/* Afficher le formulaire de recherche. */}
      <SearchBar
        key={`${selectedType}:${query}`}
        initialSearch={query}
        handleSearch={handleSearch}
        handleReset={handleReset}
        searchLoading={loading}
      />

      <CustomCollection selectedType={selectedType} query={query} />

      {!loading && !error && (
        <p className="text-gray-500 mb-6">
          {total} Pokémon du catalogue officiel {query ? "trouvés" : "disponibles"}
        </p>
      )}

      {loading && <p className="text-center text-gray-500 py-10">Chargement des Pokémon...</p>}

      {error && <p className="text-center text-violet-800 py-10">{error}</p>}

      {!loading && !error && (
        <>
          {pokemons.length === 0 ? (
            <p>{query ? "Aucun Pokémon trouvé." : "Aucun Pokémon disponible."}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {pokemons.map((pokemon, index) => (
                <PokeCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  loading={index < 4 ? "eager" : "lazy"}
                />
              ))}
            </div>
          )}

          {/* Paginer les résultats ; revenir à la première page après réinitialisation. */}
          <Pagination
            page={page}
            onPrev={() => updateFilters(Math.max(1, page - 1))}
            onNext={() => {
              if (page * LIMIT < total) updateFilters(page + 1);
            }}
            disablePrev={page === 1}
            disableNext={page * LIMIT >= total}
          />
        </>
      )}
    </div>
  );
}

export default Home;
