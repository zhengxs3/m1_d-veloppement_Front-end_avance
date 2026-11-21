import express from "express";

// Lire le corps JSON : type de contenu, taille maximale (1 Mo) puis analyse. Résultat dans req.json.
const jsonMiddleware = [
  // Vérifier le type de contenu
  (req, res, next) => {
    if (!/json/i.test(req.headers["content-type"] || "")) {
      return res.status(415).json({ error: "Le contenu doit être envoyé en JSON." });
    }
    next();
  },

  // Lire le corps (1 Mo maximum)
  express.raw({ type: () => true, limit: "1mb" }),

  // Analyser le JSON
  (req, res, next) => {
    let body;
    try {
      body = JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "");
    } catch {
      return res.status(400).json({ error: "JSON invalide." });
    }
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ error: "Un objet JSON est attendu." });
    }
    req.json = body;
    next();
  },
];

export default jsonMiddleware;
