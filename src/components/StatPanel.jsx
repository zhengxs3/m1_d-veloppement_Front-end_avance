import { STAT_LABELS } from "../data/translations";
import { maximumStat } from "../services/stats";

export default function StatPanel({ stats, maximum = false }) {
  return (
    <section className="stat-panel">
      <h2>{maximum ? "Potentiel maximal" : "Statistiques de base"}</h2>
      <p className="muted stat-subtitle">{maximum ? "Niveau 100 · nature favorable" : `Total : ${stats.reduce((total, item) => total + item.base_stat, 0)}`}</p>
      {stats.map((item) => {
        const value = maximum ? maximumStat(item.base_stat, item.stat.name) : item.base_stat;
        return <div className="stat-row" key={item.stat.name}>
          <div><span>{STAT_LABELS[item.stat.name] || "Statistique"}</span><strong>{value}</strong></div>
          <div className="stat-track" role="meter" aria-label={`${STAT_LABELS[item.stat.name]}${maximum ? " au maximum" : ""}`} aria-valuenow={value} aria-valuemin={0} aria-valuemax={maximum ? 714 : 255}><span style={{ width: `${Math.min(100, value / (maximum ? 714 : 255) * 100)}%` }} /></div>
        </div>;
      })}
      {maximum && <p className="stat-footnote">IV : 31 · EV : 252 par statistique. Ces maxima ne sont pas tous atteignables simultanément.</p>}
    </section>
  );
}
