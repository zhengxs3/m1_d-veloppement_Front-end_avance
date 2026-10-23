
import { Link } from "react-router-dom";

// Menu de navigation principal
function Navbar() {
  return (
    <nav className="bg-emerald-100 text-emerald-900 p-4 shadow-md">
      <div className="max-w-6xl mx-auto flex flex-wrap gap-4 justify-between items-center">

        {/* Revenir à l'accueil en cliquant sur le titre */}
        <Link to="/" className="text-2xl font-bold">
          Mon Pokédex
        </Link>

        {/* Liens de navigation */}
        <div className="flex gap-4 items-center">
          <Link to="/" className="hover:text-emerald-700">
            Accueil
          </Link>

          <Link to="/add" className="action-button">
            + Ajouter un Pokémon
          </Link>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
