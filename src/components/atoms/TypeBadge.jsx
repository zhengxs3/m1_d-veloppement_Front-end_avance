import { Link } from "react-router-dom";
import { TYPE_LABELS } from "../../data/translations";

// Types sans page de catalogue : leur étiquette n'est jamais cliquable.
const NOT_SEARCHABLE = ["unknown", "stellar"];

// Étiquette de type. Avec linked, un clic ouvre la liste des Pokémon de ce type (/?type=fire).
export default function TypeBadge({ type, children, linked = false }) {
  const label = children || TYPE_LABELS[type] || "Inconnu";
  const className = `type-badge type-${type}`;

  if (!linked || !TYPE_LABELS[type] || NOT_SEARCHABLE.includes(type)) {
    return <span className={className}>{label}</span>;
  }
  return (
    <Link
      to={`/?type=${type}`}
      className={`${className} type-link`}
      aria-label={`Voir les Pokémon de type ${label}`}
      title={`Voir les Pokémon de type ${label}`}
    >
      {label}
    </Link>
  );
}
