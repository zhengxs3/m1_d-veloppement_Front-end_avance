import { Link, useLocation } from "react-router-dom";
import TypeBadge from "../atoms/TypeBadge";

export function Unavailable() {
  return <p className="muted">Ces informations ne sont pas disponibles pour ce Pokémon.</p>;
}
const unavailable = <Unavailable />;

export function Defense({ defenses }) {
  if (!defenses) return unavailable;
  const groups = [
    ["Faiblesses", "Ces types infligent davantage de dégâts.", (value) => value > 1],
    ["Résistances", "Ces types infligent moins de dégâts.", (value) => value > 0 && value < 1],
    ["Immunités", "Ces types n’infligent aucun dégât.", (value) => value === 0],
  ];
  return (
    <div className="defense-groups">
      {groups.map(([title, subtitle, filter]) => {
        const matches = defenses.filter((item) => filter(item.multiplier));
        return (
          <section key={title}>
            <h3>{title}</h3>
            <p className="muted">{subtitle}</p>
            <div className="matchups">
              {matches.length ? (
                matches.map(({ type, multiplier }) => (
                  <div key={type}>
                    <strong>×{String(multiplier).replace(".", ",")}</strong>
                    <TypeBadge type={type} />
                  </div>
                ))
              ) : (
                <p className="muted">Aucune</p>
              )}
            </div>
          </section>
        );
      })}
      <p className="stat-footnote">
        Calcul selon les types actuels, sans les effets des talents, objets ou capacités.
      </p>
    </div>
  );
}

export function Evolution({ evolutions }) {
  const location = useLocation();
  if (!evolutions?.length) return unavailable;
  return (
    <div>
      <h3 className="section-title">Famille d’évolution</h3>
      <div className="evolution-grid">
        {evolutions.map((entry) => (
          <Link
            className="evolution-card"
            key={entry.id}
            to={`/poke/${entry.id}`}
            state={location.state}
          >
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${entry.id}.png`}
              alt={entry.nom}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/pokemon-placeholder.svg";
              }}
            />
            <strong>{entry.nom}</strong>
            {entry.parent && (
              <span className="muted">
                Depuis{" "}
                {evolutions.find((parent) => parent.key === entry.parent)?.nom ||
                  "la forme précédente"}
              </span>
            )}
            <span className="evolution-condition">{entry.condition}</span>
          </Link>
        ))}
      </div>
      <p className="stat-footnote">
        Les conditions affichées résument une méthode d’évolution ; certaines formes demandent des
        conditions supplémentaires.
      </p>
    </div>
  );
}

export function Moves({ moves }) {
  if (!moves?.length) return unavailable;
  return (
    <div>
      <h3 className="section-title">Un aperçu de ses capacités</h3>
      <p className="muted mb-4">12 capacités au maximum. Leur apprentissage varie selon le jeu.</p>
      <div className="moves-list">
        {moves.map((move) => (
          <article className="move-card" key={move.id}>
            <div className="move-heading">
              <h4>{move.nom}</h4>
              <TypeBadge type={move.type} />
            </div>
            <p className="muted">{move.description}</p>
            <dl className="move-values">
              <div>
                <dt>Puissance</dt>
                <dd>{move.power ?? "—"}</dd>
              </div>
              <div>
                <dt>Précision</dt>
                <dd>{move.accuracy === null ? "—" : `${move.accuracy} %`}</dd>
              </div>
              <div>
                <dt>PP</dt>
                <dd>{move.pp}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}

export function Breeding({ species, eggGroups }) {
  if (!species) return unavailable;
  return (
    <div>
      <h3 className="section-title">Reproduction et rencontre</h3>
      <dl className="facts-grid">
        <div>
          <dt>Groupes d’Œufs</dt>
          <dd>{eggGroups?.join(", ") || "Non renseignés"}</dd>
        </div>
        <div>
          <dt>Répartition des sexes</dt>
          <dd>
            {species.gender_rate === -1
              ? "Asexué"
              : `${100 - species.gender_rate * 12.5} % mâle · ${
                  species.gender_rate * 12.5
                } % femelle`}
          </dd>
        </div>
        <div>
          <dt>Cycles d’éclosion</dt>
          <dd>{species.hatch_counter ?? "Non renseignés"}</dd>
        </div>
        <div>
          <dt>Taux de capture</dt>
          <dd>{species.capture_rate ?? "—"} / 255</dd>
        </div>
        <div>
          <dt>Bonheur de base</dt>
          <dd>{species.base_happiness ?? "Non renseigné"}</dd>
        </div>
        <div>
          <dt>Rareté</dt>
          <dd>
            {species.is_mythical
              ? "Fabuleux"
              : species.is_legendary
              ? "Légendaire"
              : "Espèce ordinaire"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
