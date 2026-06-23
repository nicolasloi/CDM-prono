// « Joueur(s) en forme » : plus gros gain de points sur les dernières 24h (par rapport
// au relevé le plus récent antérieur à 24h, sinon le plus ancien disponible).
// En cas d'égalité au sommet, on renvoie TOUS les ex æquo.
export function topMover(ts, windowMs = 24 * 3600 * 1000) {
  let gain = 0;
  let names = [];
  for (const series of Object.values(ts)) {
    if (!series || series.length < 2) continue;
    const cur = series[series.length - 1];
    const cutoff = Date.parse(cur.takenAt) - windowMs;
    let baseline = series[0];
    for (const p of series) { if (Date.parse(p.takenAt) <= cutoff) baseline = p; }
    const g = cur.totalPoints - baseline.totalPoints;
    if (g <= 0) continue;
    if (g > gain) { gain = g; names = [cur.name]; }
    else if (g === gain) names.push(cur.name);
  }
  return gain > 0 ? { names, gain } : null;
}
