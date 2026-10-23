// Conserver les identifiants de l'API et afficher les libellés français.
import { TYPE_LABELS } from "../data/translations";

const TYPES = [
  ["fire", "🔥"], ["water", "💧"],
  ["grass", "🌿"], ["flying", "🪽"],
  ["electric", "⚡"], ["ice", "❄️"],
  ["normal", "⭐"], ["fighting", "🥊"],
  ["poison", "🧪"], ["ground", "🏜️"],
  ["rock", "🪨"], ["bug", "🐛"],
  ["psychic", "🔮"], ["ghost", "👻"],
  ["dragon", "🐉"], ["dark", "🌙"],
  ["steel", "⚙️"], ["fairy", "✨"],
];

function TypeFilter({ selectedType, onSelect }) {
  return (
    <section className="mb-8" aria-label="Filtrer les Pokémon par type">
      <h2 className="text-xl font-bold mb-4">Parcourir par type</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[["", "📖"], ...TYPES].map(([type, icon]) => (
          <button
            key={type}
            type="button"
            aria-pressed={selectedType === type}
            onClick={() => onSelect(type)}
            className={`rounded-xl shadow-md px-4 py-3 font-semibold transition focus-visible:outline-2 focus-visible:outline-emerald-400 ${
              selectedType === type
                ? "bg-emerald-200 text-emerald-950 ring-1 ring-emerald-300 hover:bg-emerald-300"
                : "bg-white text-gray-700 hover:bg-gray-100 hover:shadow-xl"
            }`}
          >
            <span aria-hidden="true">{icon}</span> {type ? TYPE_LABELS[type] : "Tous"}
          </button>
        ))}
      </div>
    </section>
  );
}

export default TypeFilter;
