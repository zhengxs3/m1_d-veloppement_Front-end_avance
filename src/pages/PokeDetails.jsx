import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPokemonDetails } from "../services/api";
import { getPokemonImage } from "../services/customPokemons";
import { getPokemonProfile, cleanText } from "../services/pokemonProfile";
import StatPanel from "../components/StatPanel";
import TypeBadge from "../components/TypeBadge";

const TABS = [["defense", "Défense"], ["evolution", "Évolutions"], ["moves", "Capacités"], ["breeding", "Reproduction"]];
const unavailable = <p className="muted">Ces informations ne sont pas disponibles pour ce Pokémon.</p>;

function Defense({ defenses }) {
  if (!defenses) return unavailable;
  const groups = [
    ["Faiblesses", "Ces types infligent davantage de dégâts.", (value) => value > 1],
    ["Résistances", "Ces types infligent moins de dégâts.", (value) => value > 0 && value < 1],
    ["Immunités", "Ces types n’infligent aucun dégât.", (value) => value === 0],
  ];
  return <div className="defense-groups">{groups.map(([title, subtitle, filter]) => {
    const matches = defenses.filter((item) => filter(item.multiplier));
    return <section key={title}><h3>{title}</h3><p className="muted">{subtitle}</p><div className="matchups">{matches.length ? matches.map(({ type, multiplier }) => <div key={type}><strong>×{String(multiplier).replace(".", ",")}</strong><TypeBadge type={type} /></div>) : <p className="muted">Aucune</p>}</div></section>;
  })}<p className="stat-footnote">Calcul selon les types actuels, sans les effets des talents, objets ou capacités.</p></div>;
}

function Evolution({ evolutions }) {
  if (!evolutions?.length) return unavailable;
  return <div><h3 className="section-title">Famille d’évolution</h3><div className="evolution-grid">{evolutions.map((entry) => <Link className="evolution-card" key={entry.id} to={`/poke/${entry.id}`}>
    <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${entry.id}.png`} alt={entry.nom} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/pokemon-placeholder.svg"; }} />
    <strong>{entry.nom}</strong>
    {entry.parent && <span className="muted">Depuis {evolutions.find((parent) => parent.key === entry.parent)?.nom || "la forme précédente"}</span>}
    <span className="evolution-condition">{entry.condition}</span>
  </Link>)}</div><p className="stat-footnote">Les conditions affichées résument une méthode d’évolution ; certaines formes demandent des conditions supplémentaires.</p></div>;
}

function Moves({ moves }) {
  if (!moves?.length) return unavailable;
  return <div><h3 className="section-title">Un aperçu de ses capacités</h3><p className="muted mb-4">12 capacités au maximum. Leur apprentissage varie selon le jeu.</p><div className="moves-list">{moves.map((move) => <article className="move-card" key={move.id}>
    <div className="move-heading"><h4>{move.nom}</h4><TypeBadge type={move.type} /></div><p className="muted">{move.description}</p>
    <dl className="move-values"><div><dt>Puissance</dt><dd>{move.power ?? "—"}</dd></div><div><dt>Précision</dt><dd>{move.accuracy === null ? "—" : `${move.accuracy} %`}</dd></div><div><dt>PP</dt><dd>{move.pp}</dd></div></dl>
  </article>)}</div></div>;
}

function Breeding({ species, eggGroups }) {
  if (!species) return unavailable;
  return <div><h3 className="section-title">Reproduction et rencontre</h3><dl className="facts-grid">
    <div><dt>Groupes d’Œufs</dt><dd>{eggGroups?.join(", ") || "Non renseignés"}</dd></div>
    <div><dt>Répartition des sexes</dt><dd>{species.gender_rate === -1 ? "Asexué" : `${100 - species.gender_rate * 12.5} % mâle · ${species.gender_rate * 12.5} % femelle`}</dd></div>
    <div><dt>Cycles d’éclosion</dt><dd>{species.hatch_counter ?? "Non renseignés"}</dd></div>
    <div><dt>Taux de capture</dt><dd>{species.capture_rate ?? "—"} / 255</dd></div>
    <div><dt>Bonheur de base</dt><dd>{species.base_happiness ?? "Non renseigné"}</dd></div>
    <div><dt>Rareté</dt><dd>{species.is_mythical ? "Fabuleux" : species.is_legendary ? "Légendaire" : "Espèce ordinaire"}</dd></div>
  </dl></div>;
}

export default function PokeDetails() {
  const { id } = useParams();
  const [state, setState] = useState({ id: null });
  const [profile, setProfile] = useState({ id: null });
  const [tab, setTab] = useState("defense");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getPokemonDetails(id).then(async ({ data }) => {
      if (cancelled) return;
      setState({ id, pokemon: data });
      const details = await getPokemonProfile(data);
      if (!cancelled) setProfile({ id, ...details });
    }).catch(() => {
      if (!cancelled) setState({ id, error: "Impossible de charger cette fiche. Vérifiez votre connexion puis réessayez." });
    });
    return () => { cancelled = true; };
  }, [id, retry]);

  if (state.id !== id) return <div className="detail-loading" role="status">Chargement de la fiche Pokémon…</div>;
  if (state.error) return <div className="notice" role="alert"><p>{state.error}</p><button className="action-button mt-4" onClick={() => { setState({ id: null }); setRetry((value) => value + 1); }}>Réessayer</button><Link to="/" className="back-link ml-4">Retour à la liste</Link></div>;
  const pokemon = state.pokemon;
  const species = pokemon.speciesData;
  const description = pokemon.description || cleanText(species?.flavor_text_entries?.find((entry) => entry.language.name === "fr")?.flavor_text) || "Aucune description disponible en français.";
  const category = pokemon.category || species?.genera?.find((entry) => entry.language.name === "fr")?.genus || "Pokémon personnel";
  const ready = profile.id === id;
  const previous = !pokemon.isCustom && pokemon.id > 1 && pokemon.id <= 1025 ? pokemon.id - 1 : null;
  const next = !pokemon.isCustom && pokemon.id < 1025 ? pokemon.id + 1 : null;
  const image = getPokemonImage(pokemon);

  return <div className="pokemon-page">
    <div className="detail-toolbar"><Link to="/" className="back-link">← Retour au Pokédex</Link><Link to="/add" className="action-button">+ Ajouter un Pokémon</Link></div>
    <article className="pokemon-dossier">
      <header className="dossier-header"><span className="eyebrow">{pokemon.isCustom ? "MA COLLECTION" : "POKÉDEX NATIONAL"}</span><div className="pokemon-neighbors">{previous && <Link to={`/poke/${previous}`} aria-label="Pokémon précédent">← N° {String(previous).padStart(3, "0")}</Link>}{next && <Link to={`/poke/${next}`} aria-label="Pokémon suivant">N° {String(next).padStart(3, "0")} →</Link>}</div></header>
      <div className="dossier-layout">
        <aside className="pokemon-overview">
          <div className="artwork-stage"><img src={image} alt={pokemon.nom} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/pokemon-placeholder.svg"; }} /></div>
          <span className="pokemon-number">{pokemon.isCustom ? "CRÉATION PERSONNELLE" : `N° ${String(pokemon.id).padStart(3, "0")}`}</span>
          <h1>{pokemon.nom}</h1><p className="pokemon-category">{category}</p>
          <div className="flex flex-wrap gap-2 mt-4 mb-6">{pokemon.types.map(({ type }) => <TypeBadge key={type.name} type={type.name} />)}</div>
          <dl className="overview-metrics"><div><dt>Taille</dt><dd>{(pokemon.height / 10).toLocaleString("fr-FR")} <span>m</span></dd></div><div><dt>Poids</dt><dd>{(pokemon.weight / 10).toLocaleString("fr-FR")} <span>kg</span></dd></div></dl>
          <section className="overview-section"><h2>À propos</h2><p>{description}</p></section>
          <section className="overview-section"><h2>Talents</h2>{pokemon.customAbility ? <p>{pokemon.customAbility}</p> : !ready ? <p className="muted">Chargement des talents…</p> : profile.abilities?.length ? profile.abilities.map((ability) => <div className="ability" key={ability.nom}><strong>{ability.nom}</strong>{ability.hidden && <span className="hidden-ability">Talent caché</span>}<p>{ability.description}</p></div>) : unavailable}</section>
          {pokemon.isCustom && <p className="stat-footnote">Créé par vous et conservé dans ce navigateur.</p>}
        </aside>
        <div className="pokemon-information">
          <div className="stats-columns"><StatPanel stats={pokemon.stats} /><StatPanel stats={pokemon.stats} maximum /></div>
          <div className="profile-tabs" role="tablist" aria-label="Informations du Pokémon">{TABS.map(([key, label], index) => <button key={key} role="tab" id={`tab-${key}`} aria-selected={tab === key} aria-controls="profile-panel" tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)} onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const newIndex = event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
            setTab(TABS[newIndex][0]);
            document.getElementById(`tab-${TABS[newIndex][0]}`).focus();
          }}>{label}</button>)}</div>
          <section className="profile-panel" id="profile-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
            {!ready ? <p className="muted" role="status">Chargement des informations complémentaires…</p> : <>
              {profile.partial && <p className="notice mb-5">Certaines rubriques n’ont pas pu être chargées. <button className="underline" onClick={() => { setProfile({ id: null }); setRetry((value) => value + 1); }}>Réessayer</button></p>}
              {tab === "defense" && <Defense defenses={profile.defenses} />}
              {tab === "evolution" && <Evolution evolutions={profile.evolutions} />}
              {tab === "moves" && <Moves moves={profile.moves} />}
              {tab === "breeding" && <Breeding species={species} eggGroups={profile.eggGroups} />}
            </>}
          </section>
          <footer className="dossier-footer">{pokemon.isCustom ? "Fiche personnelle · Les rubriques officielles non renseignées restent indisponibles." : "Données : PokéAPI · Les informations peuvent varier selon la version du jeu."}</footer>
        </div>
      </div>
    </article>
  </div>;
}
