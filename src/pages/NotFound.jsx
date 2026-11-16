import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="detail-loading">
      <h1 className="text-3xl font-bold mb-4">Page introuvable</h1>
      <p className="mb-4">Cette adresse ne correspond à aucune page du Pokédex.</p>
      <Link className="action-button" to="/">
        Retour au Pokédex
      </Link>
    </section>
  );
}
