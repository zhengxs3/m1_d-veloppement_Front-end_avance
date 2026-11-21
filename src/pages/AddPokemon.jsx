import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TYPE_LABELS, STAT_LABELS } from "../data/translations";
import {
  getCustomPokemon,
  saveCustomPokemon,
  updateCustomPokemon,
} from "../services/customPokemonApi";

const TYPES = Object.entries(TYPE_LABELS).filter(([key]) => !["unknown", "stellar"].includes(key));
const PLACEHOLDER = "/pokemon-placeholder.svg";

// Même formulaire pour l'ajout (/add) et la modification (/poke/:id/edit).
export default function AddPokemon() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // Création à modifier : chargée depuis l'API uniquement en mode modification.
  const [existing, setExisting] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    getCustomPokemon(id)
      .then((data) => {
        if (!cancelled) setExisting(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Impossible de charger cette création.");
      });
    return () => {
      cancelled = true;
    };
  }, [editing, id]);

  const stat = (name) => existing?.stats?.find((entry) => entry.stat.name === name)?.base_stat;
  const savedImage = existing?.sprites?.front_default;

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nom = form.get("nom").trim();
    const image = form.get("image").trim();
    if (!nom) return setError("Veuillez saisir le nom du Pokémon.");
    if (image && !/^https?:\/\//i.test(image))
      return setError("L’image doit utiliser une adresse http ou https.");
    setSaving(true);
    setError("");
    try {
      const types = [...new Set([form.get("type"), form.get("secondType")].filter(Boolean))];
      const payload = {
        nom,
        name: nom.toLowerCase(),
        description: form.get("description").trim(),
        category: form.get("category").trim(),
        customAbility: form.get("ability").trim(),
        height: Number(form.get("height")) * 10,
        weight: Number(form.get("weight")) * 10,
        types: types.map((name) => ({ type: { name } })),
        sprites: { front_default: image || PLACEHOLDER },
        stats: Object.keys(STAT_LABELS)
          .slice(0, 6)
          .map((name) => ({ stat: { name }, base_stat: Number(form.get(name)) })),
      };
      const pokemon = editing
        ? await updateCustomPokemon(id, payload)
        : await saveCustomPokemon(payload);
      navigate(`/poke/${pokemon.id}`);
    } catch (error) {
      setError(
        typeof error.response?.data?.error === "string" && error.response.data.error.trim()
          ? error.response.data.error
          : "Impossible d’enregistrer ce Pokémon. Vérifiez que le serveur de créations est accessible, puis réessayez.",
      );
      setSaving(false);
    }
  }

  if (editing && loadError)
    return (
      <div className="notice" role="alert">
        <p>{loadError}</p>
        <Link to="/" className="back-link">
          Retour au Pokédex
        </Link>
      </div>
    );
  if (editing && !existing)
    return (
      <p role="status" className="detail-loading">
        Chargement de la création…
      </p>
    );

  return (
    <div className="creation-page">
      <Link to={editing ? `/poke/${id}` : "/"} className="back-link">
        {editing ? "← Retour à la fiche" : "← Retour au Pokédex"}
      </Link>
      <header className="page-intro">
        <span className="eyebrow">VOTRE COLLECTION</span>
        <h1>{editing ? `Modifier ${existing.nom}` : "Créer un nouveau Pokémon"}</h1>
        <p>
          {editing
            ? "Modifiez la fiche de votre création. Les changements sont enregistrés dans la collection partagée."
            : "Imaginez votre compagnon et complétez sa fiche. Il sera enregistré dans la collection partagée."}
        </p>
      </header>
      <form onSubmit={handleSubmit} className="creation-form">
        <fieldset>
          <legend>01 · Identité</legend>
          <div className="form-grid">
            <label>
              Nom du Pokémon *
              <input
                name="nom"
                required
                maxLength={60}
                placeholder="Ex. : Floréa"
                defaultValue={existing?.nom}
              />
            </label>
            <label>
              Catégorie
              <input
                name="category"
                maxLength={80}
                placeholder="Ex. : Pokémon Bourgeon"
                defaultValue={existing?.category}
              />
            </label>
            <label>
              Type principal *
              <select
                name="type"
                defaultValue={existing?.types?.[0]?.type.name || "grass"}
                required
              >
                {TYPES.map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type secondaire
              <select name="secondType" defaultValue={existing?.types?.[1]?.type.name || ""}>
                <option value="">Aucun</option>
                {TYPES.map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Taille (m) *
              <input
                name="height"
                type="number"
                min="0.1"
                max="1000"
                step="0.1"
                required
                placeholder="0,7"
                defaultValue={existing ? existing.height / 10 : undefined}
              />
            </label>
            <label>
              Poids (kg) *
              <input
                name="weight"
                type="number"
                min="0.1"
                max="100000"
                step="0.1"
                required
                placeholder="6,9"
                defaultValue={existing ? existing.weight / 10 : undefined}
              />
            </label>
            <label className="full-width">
              Adresse de l’illustration
              <input
                name="image"
                type="url"
                maxLength={2000}
                placeholder="https://…"
                defaultValue={savedImage && savedImage !== PLACEHOLDER ? savedImage : ""}
              />
              <small>Facultatif. Une illustration par défaut est prévue.</small>
            </label>
            <label className="full-width">
              Description
              <textarea
                name="description"
                rows={4}
                maxLength={1500}
                placeholder="Son habitat, son caractère, son histoire…"
                defaultValue={existing?.description}
              />
            </label>
            <label className="full-width">
              Talent
              <input
                name="ability"
                maxLength={120}
                placeholder="Ex. : Absorbe la lumière pour retrouver de l’énergie"
                defaultValue={existing?.customAbility}
              />
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>02 · Statistiques de base</legend>
          <p className="muted mb-5">Choisissez une valeur de 1 à 255 pour chaque statistique.</p>
          <div className="form-grid stats-form">
            {Object.entries(STAT_LABELS)
              .slice(0, 6)
              .map(([key, value]) => (
                <label key={key}>
                  {value}
                  <input
                    name={key}
                    type="number"
                    min="1"
                    max="255"
                    step="1"
                    defaultValue={stat(key) ?? 50}
                    required
                  />
                </label>
              ))}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
        <div className="form-actions">
          <span className="muted">* Champs obligatoires</span>
          <div className="flex gap-3 items-center">
            <Link className="back-link" to={editing ? `/poke/${id}` : "/"}>
              Annuler
            </Link>
            <button className="action-button" type="submit" disabled={saving}>
              {saving
                ? "Enregistrement…"
                : editing
                ? "Enregistrer les modifications"
                : "+ Ajouter à mon Pokédex"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
