// « Joueur en forme » : plus gros gain de points sur les dernières 24h (par rapport
// au relevé le plus récent antérieur à 24h, sinon le plus ancien disponible).
export function topMover(ts, windowMs = 24 * 3600 * 1000) {
  let best = null;
  for (const series of Object.values(ts)) {
    if (!series || series.length < 2) continue;
    const cur = series[series.length - 1];
    const cutoff = Date.parse(cur.takenAt) - windowMs;
    let baseline = series[0];
    for (const p of series) { if (Date.parse(p.takenAt) <= cutoff) baseline = p; }
    const gain = cur.totalPoints - baseline.totalPoints;
    if (!best || gain > best.gain) best = { name: cur.name, gain };
  }
  return best && best.gain > 0 ? best : null;
}
