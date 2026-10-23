// Calculer chaque maximum séparément : niveau 100, IV 31, EV 252, nature favorable.
export function maximumStat(base, name) {
  if (name === "hp") return base === 1 ? 1 : base * 2 + 204;
  return Math.floor((base * 2 + 99) * 1.1);
}
