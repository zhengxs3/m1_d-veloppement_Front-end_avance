// Route inconnue : 404 au format JSON.
export const notFound = (req, res) => {
  res.status(404).json({ error: "Route introuvable." });
};

// Erreurs non gérées par un contrôleur (taille du corps, panne inattendue) : réponse JSON.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, req, res, next) => {
  if (error.type === "entity.too.large") {
    return res.status(413).json({ error: "Le contenu est trop volumineux." });
  }
  res.status(500).json({ error: "Erreur interne du serveur." });
};
