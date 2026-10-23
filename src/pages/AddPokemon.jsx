import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TYPE_LABELS, STAT_LABELS } from "../data/translations";
import { saveCustomPokemon } from "../services/customPokemons";

const TYPES = Object.entries(TYPE_LABELS).filter(([key]) => !["unknown", "stellar"].includes(key));

export default function AddPokemon() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nom = form.get("nom").trim();
    const image = form.get("image").trim();
    if (!nom) return setError("Veuillez saisir le nom du Pokémon.");
    if (image && !/^https?:\/\//i.test(image)) return setError("L’image doit utiliser une adresse http ou https.");
    setSaving(true);
    setError("");
    try {
      const types = [...new Set([form.get("type"), form.get("secondType")].filter(Boolean))];
      const pokemon = saveCustomPokemon({
        nom, name: nom.toLowerCase(), description: form.get("description").trim(),
        category: form.get("category").trim(), customAbility: form.get("ability").trim(),
        height: Number(form.get("height")) * 10, weight: Number(form.get("weight")) * 10,
        types: types.map((name) => ({ type: { name } })),
        sprites: { front_default: image || "/pokemon-placeholder.svg" },
        stats: Object.keys(STAT_LABELS).slice(0, 6).map((name) => ({ stat: { name }, base_stat: Number(form.get(name)) })),
      });
      navigate(`/poke/${pokemon.id}`);
    } catch {
      setError("Impossible d’enregistrer ce Pokémon. Vérifiez que le stockage du navigateur est disponible.");
      setSaving(false);
    }
  }

  return (
    <div className="creation-page">
      <Link to="/" className="back-link">← Retour au Pokédex</Link>
      <header className="page-intro">
        <span className="eyebrow">VOTRE COLLECTION</span>
        <h1>Créer un nouveau Pokémon</h1>
        <p>Imaginez votre compagnon et complétez sa fiche. Il sera conservé dans ce navigateur.</p>
      </header>
      <form onSubmit={handleSubmit} className="creation-form">
        <fieldset>
          <legend>01 · Identité</legend>
          <div className="form-grid">
            <label>Nom du Pokémon *<input name="nom" required maxLength={60} placeholder="Ex. : Floréa" /></label>
            <label>Catégorie<input name="category" maxLength={80} placeholder="Ex. : Pokémon Bourgeon" /></label>
            <label>Type principal *<select name="type" defaultValue="grass" required>{TYPES.map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
            <label>Type secondaire<select name="secondType" defaultValue=""><option value="">Aucun</option>{TYPES.map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
            <label>Taille (m) *<input name="height" type="number" min="0.1" max="1000" step="0.1" required placeholder="0,7" /></label>
            <label>Poids (kg) *<input name="weight" type="number" min="0.1" max="100000" step="0.1" required placeholder="6,9" /></label>
            <label className="full-width">Adresse de l’illustration<input name="image" type="url" maxLength={2000} placeholder="https://…" /><small>Facultatif. Une illustration par défaut est prévue.</small></label>
            <label className="full-width">Description<textarea name="description" rows={4} maxLength={1500} placeholder="Son habitat, son caractère, son histoire…" /></label>
            <label className="full-width">Talent<input name="ability" maxLength={120} placeholder="Ex. : Absorbe la lumière pour retrouver de l’énergie" /></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>02 · Statistiques de base</legend>
          <p className="muted mb-5">Choisissez une valeur de 1 à 255 pour chaque statistique.</p>
          <div className="form-grid stats-form">
            {Object.entries(STAT_LABELS).slice(0, 6).map(([key, value]) => <label key={key}>{value}<input name={key} type="number" min="1" max="255" step="1" defaultValue={50} required /></label>)}
          </div>
        </fieldset>
        {error && <p role="alert" className="notice">{error}</p>}
        <div className="form-actions"><span className="muted">* Champs obligatoires</span><div className="flex gap-3 items-center"><Link className="back-link" to="/">Annuler</Link><button className="action-button" type="submit" disabled={saving}>{saving ? "Enregistrement…" : "+ Ajouter à mon Pokédex"}</button></div></div>
      </form>
    </div>
  );
}
