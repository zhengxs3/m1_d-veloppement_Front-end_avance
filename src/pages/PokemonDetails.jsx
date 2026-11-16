import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { getPokemonDetails } from "../services/api";
import { getPokemonImage } from "../services/customPokemonApi";
import { getPokemonSection, cleanText } from "../services/pokemonSections";
import {
  Defense,
  Evolution,
  Moves,
  Breeding,
  Unavailable,
} from "../components/organisms/PokemonSections";
import StatPanel from "../components/molecules/StatPanel";
import TypeBadge from "../components/atoms/TypeBadge";

const TABS = [
  ["defense", "Défense"],
  ["evolution", "Évolutions"],
  ["moves", "Capacités"],
  ["breeding", "Reproduction"],
];
const unavailable = <Unavailable />;
export default function PokeDetails() {
  const { id } = useParams();
  const location = useLocation();
  const returnTo = location.state?.returnTo || "/";
  const [state, setState] = useState({ id: null });
  const [abilities, setAbilities] = useState({ id: null });
  const [section, setSection] = useState({ id: null });
  const [tab, setTab] = useState("defense");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getPokemonDetails(id)
      .then(({ data }) => {
        if (cancelled) return;
        setState({ id, pokemon: data });
      })
      .catch(() => {
        if (!cancelled)
          setState({
            id,
            error: "Impossible de charger cette fiche. Vérifiez votre connexion puis réessayez.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [id, retry]);

  const loadedPokemon = state.id === id ? state.pokemon : null;
  useEffect(() => {
    if (!loadedPokemon) return;
    let cancelled = false;
    getPokemonSection(loadedPokemon, "abilities")
      .then((items) => {
        if (!cancelled) setAbilities({ id, items });
      })
      .catch(() => {
        if (!cancelled) setAbilities({ id, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [id, loadedPokemon, retry]);

  useEffect(() => {
    if (!loadedPokemon) return;
    let cancelled = false;
    getPokemonSection(loadedPokemon, tab)
      .then((value) => {
        if (!cancelled) setSection({ id, tab, value });
      })
      .catch(() => {
        if (!cancelled) setSection({ id, tab, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [id, loadedPokemon, tab, retry]);

  if (state.id !== id)
    return (
      <div className="detail-loading" role="status">
        Chargement de la fiche Pokémon…
      </div>
    );
  if (state.error)
    return (
      <div className="notice" role="alert">
        <p>{state.error}</p>
        <button
          className="action-button mt-4"
          onClick={() => {
            setState({ id: null });
            setRetry((value) => value + 1);
          }}
        >
          Réessayer
        </button>
        <Link to={returnTo} className="back-link ml-4">
          Retour à la liste
        </Link>
      </div>
    );
  const pokemon = state.pokemon;
  const species = pokemon.speciesData;
  const description =
    pokemon.description ||
    cleanText(
      species?.flavor_text_entries?.find((entry) => entry.language.name === "fr")?.flavor_text,
    ) ||
    "Aucune description disponible en français.";
  const category =
    pokemon.category ||
    species?.genera?.find((entry) => entry.language.name === "fr")?.genus ||
    "Pokémon personnel";
  const ready = section.id === id && section.tab === tab;
  const abilitiesReady = abilities.id === id;
  const previous =
    !pokemon.isCustom && pokemon.id > 1 && pokemon.id <= 1025 ? pokemon.id - 1 : null;
  const next = !pokemon.isCustom && pokemon.id < 1025 ? pokemon.id + 1 : null;
  const image = getPokemonImage(pokemon);

  return (
    <div className="pokemon-page">
      <div className="detail-toolbar">
        <Link to={returnTo} className="back-link">
          ← Retour au Pokédex
        </Link>
        <Link to="/add" className="action-button">
          + Ajouter un Pokémon
        </Link>
      </div>
      <article className="pokemon-dossier">
        <header className="dossier-header">
          <span className="eyebrow">{pokemon.isCustom ? "MA COLLECTION" : "POKÉDEX NATIONAL"}</span>
          <div className="pokemon-neighbors">
            {previous && (
              <Link to={`/poke/${previous}`} state={{ returnTo }} aria-label="Pokémon précédent">
                ← N° {String(previous).padStart(3, "0")}
              </Link>
            )}
            {next && (
              <Link to={`/poke/${next}`} state={{ returnTo }} aria-label="Pokémon suivant">
                N° {String(next).padStart(3, "0")} →
              </Link>
            )}
          </div>
        </header>
        <div className="dossier-layout">
          <aside className="pokemon-overview">
            <div className="artwork-stage">
              <img
                src={image}
                alt={pokemon.nom}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/pokemon-placeholder.svg";
                }}
              />
            </div>
            <span className="pokemon-number">
              {pokemon.isCustom
                ? "CRÉATION PERSONNELLE"
                : `N° ${String(pokemon.id).padStart(3, "0")}`}
            </span>
            <h1>{pokemon.nom}</h1>
            <p className="pokemon-category">{category}</p>
            <div className="flex flex-wrap gap-2 mt-4 mb-6">
              {pokemon.types.map(({ type }) => (
                <TypeBadge key={type.name} type={type.name} />
              ))}
            </div>
            <dl className="overview-metrics">
              <div>
                <dt>Taille</dt>
                <dd>
                  {(pokemon.height / 10).toLocaleString("fr-FR")} <span>m</span>
                </dd>
              </div>
              <div>
                <dt>Poids</dt>
                <dd>
                  {(pokemon.weight / 10).toLocaleString("fr-FR")} <span>kg</span>
                </dd>
              </div>
            </dl>
            <section className="overview-section">
              <h2>À propos</h2>
              <p>{description}</p>
            </section>
            <section className="overview-section">
              <h2>Talents</h2>
              {pokemon.customAbility ? (
                <p>{pokemon.customAbility}</p>
              ) : !abilitiesReady ? (
                <p className="muted">Chargement des talents…</p>
              ) : abilities.items?.length ? (
                abilities.items.map((ability) => (
                  <div className="ability" key={ability.nom}>
                    <strong>{ability.nom}</strong>
                    {ability.hidden && <span className="hidden-ability">Talent caché</span>}
                    <p>{ability.description}</p>
                  </div>
                ))
              ) : (
                unavailable
              )}
            </section>
            {abilities.error && abilitiesReady && (
              <p className="notice">
                Les talents n’ont pas pu être chargés.{" "}
                <button className="underline" onClick={() => setRetry((value) => value + 1)}>
                  Réessayer
                </button>
              </p>
            )}
            {pokemon.isCustom && (
              <p className="stat-footnote">Création enregistrée dans la collection partagée.</p>
            )}
          </aside>
          <div className="pokemon-information">
            <div className="stats-columns">
              <StatPanel stats={pokemon.stats} />
              <StatPanel stats={pokemon.stats} maximum />
            </div>
            <div className="profile-tabs" role="tablist" aria-label="Informations du Pokémon">
              {TABS.map(([key, label], index) => (
                <button
                  key={key}
                  role="tab"
                  id={`tab-${key}`}
                  aria-selected={tab === key}
                  aria-controls="profile-panel"
                  tabIndex={tab === key ? 0 : -1}
                  onClick={() => setTab(key)}
                  onKeyDown={(event) => {
                    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                    event.preventDefault();
                    const newIndex =
                      event.key === "Home"
                        ? 0
                        : event.key === "End"
                        ? TABS.length - 1
                        : (index + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) %
                          TABS.length;
                    setTab(TABS[newIndex][0]);
                    document.getElementById(`tab-${TABS[newIndex][0]}`).focus();
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <section
              className="profile-panel"
              id="profile-panel"
              role="tabpanel"
              aria-labelledby={`tab-${tab}`}
              tabIndex={0}
            >
              {!ready ? (
                <p className="muted" role="status">
                  Chargement des informations complémentaires…
                </p>
              ) : (
                <>
                  {section.error && (
                    <p className="notice mb-5">
                      Certaines rubriques n’ont pas pu être chargées.{" "}
                      <button
                        className="underline"
                        onClick={() => {
                          setRetry((value) => value + 1);
                        }}
                      >
                        Réessayer
                      </button>
                    </p>
                  )}
                  {tab === "defense" && <Defense defenses={section.value} />}
                  {tab === "evolution" && <Evolution evolutions={section.value} />}
                  {tab === "moves" && <Moves moves={section.value} />}
                  {tab === "breeding" && <Breeding species={species} eggGroups={section.value} />}
                </>
              )}
            </section>
            <footer className="dossier-footer">
              {pokemon.isCustom
                ? "Création partagée · Les rubriques officielles non renseignées restent indisponibles."
                : "Données : PokéAPI · Les informations peuvent varier selon la version du jeu."}
            </footer>
          </div>
        </div>
      </article>
    </div>
  );
}
