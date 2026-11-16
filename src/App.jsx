import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Importer le menu de navigation.
import Navbar from "./components/organisms/Navbar.jsx";
const Home = lazy(() => import("./pages/Home.jsx"));
const PokeDetails = lazy(() => import("./pages/PokemonDetails.jsx"));
const AddPokemon = lazy(() => import("./pages/AddPokemon.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

function App() {
  return (
    <>
      {/* Menu de navigation commun */}
      <Navbar />

      {/* Contenu de la page */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Afficher la page correspondant à l'URL */}
        <Suspense
          fallback={
            <p role="status" className="detail-loading">
              Chargement de la page…
            </p>
          }
        >
          <Routes>
            {/* Accueil */}
            <Route path="/" element={<Home />} />

            {/* Fiche du Pokémon ; :id est un paramètre dynamique */}
            <Route path="/poke/:id" element={<PokeDetails />} />

            {/* Page d'ajout de Pokémon */}
            <Route path="/add" element={<AddPokemon />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}

export default App;
