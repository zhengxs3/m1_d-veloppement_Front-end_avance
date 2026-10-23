
import { Link } from "react-router-dom";

// Recevoir les données du Pokémon en propriétés
function PokeCard({ pokemon }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 text-center hover:shadow-xl transition">

      {/* Illustration du Pokémon */}
      <img
        src={pokemon.image}
        alt={pokemon.nom}
        onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/pokemon-placeholder.svg"; }}
        className="w-32 h-32 mx-auto object-contain"
      />

      {/* Nom du Pokémon */}
      <h2 className="text-xl font-bold capitalize mt-3">
        {pokemon.nom}
      </h2>

      {/* Types du Pokémon */}
      <p className="text-gray-500 mt-2 capitalize">
        {pokemon.element}
      </p>

      {/* Lien vers la fiche détaillée */}
      <Link
        to={`/poke/${pokemon.id}`}
        className="inline-block mt-4 bg-emerald-100 text-emerald-900 px-4 py-2 rounded-lg hover:bg-emerald-200 transition"
      >
        Voir détails
      </Link>

    </div>
  );
}

export default PokeCard;
