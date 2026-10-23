
import React from "react";
import ReactDOM from "react-dom/client";

// Importer React Router.
import { BrowserRouter } from "react-router-dom";

// Importer le composant principal et les styles.
import App from "./App.jsx";
import "./index.css";
import "./profile.css";

// Afficher l'application React dans l'élément root de index.html.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Activer la navigation pour toute l'application */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
