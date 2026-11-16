import { useEffect, useState } from "react";
import PokeCard from "../molecules/PokeCard";
import { TYPE_LABELS } from "../../data/translations";
import {
  getCustomPokemons,
  getLegacyPokemons,
  getPokemonImage,
  importLegacyPokemons,
} from "../../services/customPokemonApi";

export default function CustomCollection({ selectedType, query }) {
  const [pokemons, setPokemons] = useState([]);
  const [legacy] = useState(getLegacyPokemons);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getCustomPokemons()
      .then((data) => {
        if (!cancelled) {
          setPokemons(data);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "La collection de créations est indisponible. Le catalogue officiel reste accessible.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retry]);

  const pending = legacy.filter((entry) => !pokemons.some((pokemon) => pokemon.id === entry.id));
  const visible = pokemons.filter(
    (pokemon) =>
      (!selectedType || pokemon.types.some(({ type }) => type.name === selectedType)) &&
      pokemon.nom.toLowerCase().includes(query),
  );

  async function handleImport() {
    setImporting(true);
    setError("");
    try {
      setPokemons(await importLegacyPokemons(pending));
    } catch (error) {
      setError(
        error.response?.data?.error ||
          "Import impossible. Les anciennes créations restent dans ce navigateur.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="personal-collection" aria-labelledby="creations-title">
      <div className="collection-heading">
        <h2 id="creations-title">Créations partagées</h2>
        <span className="muted">{visible.length} création(s)</span>
      </div>
      {loading && <p role="status">Chargement des créations…</p>}
      {error && (
        <div className="notice mb-4" role="alert">
          {error}{" "}
          <button
            className="underline"
            onClick={() => {
              setLoading(true);
              setRetry((value) => value + 1);
            }}
          >
            Réessayer
          </button>
        </div>
      )}
      {!loading && !error && pending.length > 0 && (
        <div className="notice mb-4">
          <p>
            {pending.length} ancienne(s) création(s) sont conservées dans ce navigateur. Vous pouvez
            les copier vers la collection partagée ; les originaux restent conservés.
          </p>
          <button className="action-button mt-3" disabled={importing} onClick={handleImport}>
            {importing ? "Import…" : "Importer mes anciennes créations"}
          </button>
        </div>
      )}
      {visible.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {visible.map((pokemon) => (
            <PokeCard
              key={pokemon.id}
              pokemon={{
                id: pokemon.id,
                nom: pokemon.nom,
                image: getPokemonImage(pokemon),
                element: pokemon.types.map(({ type }) => TYPE_LABELS[type.name]).join(", "),
              }}
            />
          ))}
        </div>
      ) : (
        !loading &&
        !error && (
          <p className="muted">
            Aucune création ne correspond à ces filtres. Ajoutez votre premier Pokémon !
          </p>
        )
      )}
    </section>
  );
}
