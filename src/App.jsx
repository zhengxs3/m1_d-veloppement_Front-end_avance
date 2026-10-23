
import { Routes, Route } from "react-router-dom";

// Importer le menu de navigation.
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import PokeDetails from "./pages/PokeDetails.jsx";
import AddPokemon from "./pages/AddPokemon.jsx";

function App() {
  return (
    <>
      {/* Menu de navigation commun */}
      <Navbar />

      {/* Contenu de la page */}
      <main className="max-w-6xl mx-auto p-6">

        {/* Afficher la page correspondant à l'URL */}
        <Routes>
          {/* Accueil */}
          <Route path="/" element={<Home />} />

          {/* Fiche du Pokémon ; :id est un paramètre dynamique */}
          <Route path="/poke/:id" element={<PokeDetails />} />

          {/* Page d'ajout de Pokémon */}
          <Route path="/add" element={<AddPokemon />} />
        </Routes>

      </main>
    </>
  );
}

export default App;
