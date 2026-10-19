import { useState } from "react";

function MonCompteur() {
  const [compteur, setCompteur] = useState(0);
  // compteur = valeur actuelle
  // setCompteur = fonction pour modifier la valeur

  return (
    <div>
      <p>Compteur : {compteur}</p>
      <button onClick={() => setCompteur(compteur + 1)}>
        Incrémenter
      </button>
    </div>
  );
}

export default MonCompteur;