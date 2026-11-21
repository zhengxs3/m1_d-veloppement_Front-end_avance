// En-têtes de sécurité, filtrage des origines (CORS) et requêtes de pré-vérification (OPTIONS).
export default function corsMiddleware(allowedOrigins) {
  return (req, res, next) => {
    const origin = req.headers.origin;
    res.set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    res.vary("Origin");
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: "Origine non autorisée." });
    }
    if (origin) {
      res.set({
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
    }
    if (req.method === "OPTIONS") return res.status(204).end();
    next();
  };
}
