
function Pagination({
  page,        // Numéro de la page actuelle
  onPrev,      // Action pour afficher la page précédente
  onNext,      // Action pour afficher la page suivante
  disablePrev, // Désactiver la page précédente
  disableNext, // Désactiver la page suivante
}) {
  return (
    <div className="flex justify-center items-center gap-4 mt-8 mb-6">

      {/* Bouton de la page précédente */}
      <button
        onClick={onPrev}
        disabled={disablePrev}
        className="bg-emerald-100 text-emerald-900 px-5 py-2 rounded-lg
                   hover:bg-emerald-200 transition
                   disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
      >
        ◀ Page précédente
      </button>

      {/* Afficher le numéro de page */}
      <span className="font-semibold text-gray-700">
        Page {page}
      </span>

      {/* Bouton de la page suivante */}
      <button
        onClick={onNext}
        disabled={disableNext}
        className="bg-emerald-100 text-emerald-900 px-5 py-2 rounded-lg
                   hover:bg-emerald-200 transition
                   disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
      >
        Page suivante ▶
      </button>

    </div>
  );
}

// Exporter le composant utilisé par Home.jsx
export default Pagination;
