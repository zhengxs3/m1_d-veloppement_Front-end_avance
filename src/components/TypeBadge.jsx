import { TYPE_LABELS } from "../data/translations";

export default function TypeBadge({ type, children }) {
  return <span className={`type-badge type-${type}`}>{children || TYPE_LABELS[type] || "Inconnu"}</span>;
}
