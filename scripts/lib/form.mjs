// « Joueur(s) en forme » : plus gros gain de points sur la DERNIÈRE JOURNÉE de matchs.
// Comme la CDM est aux USA/Canada/Mexique, les matchs se jouent la nuit en Europe (≈18h→08h CEST)
// et chevauchent minuit. On coupe donc les journées à MIDI (heure suisse), en pleine période calme
// (aucun match ~08h–18h CEST) : toute une soirée/nuit de matchs tombe dans une seule journée,
// étiquetée par le jour du soir. En cas d'égalité au sommet, on renvoie TOUS les ex æquo.
const dayOf = (iso) => new Date(new Date(iso).getTime() - 12 * 3600 * 1000)
  .toLocaleDateString('fr-CA', { timeZone: 'Europe/Zurich' });

export function topMover(ts) {
  const allSeries = Object.values(ts).filter((s) => s && s.length);
  const days = [...new Set(allSeries.flatMap((s) => s.map((p) => dayOf(p.takenAt))))].sort();
  if (days.length < 2) return null;

  // Total de fin de journée par joueur (on reporte les jours sans relevé).
  const eod = Object.values(ts).map((series) => {
    const byDay = {};
    for (const p of series) byDay[dayOf(p.takenAt)] = p.totalPoints;
    let carry = null;
    const totals = days.map((d) => { if (byDay[d] != null) carry = byDay[d]; return carry; });
    return { name: series[series.length - 1]?.name, totals };
  });

  // On remonte du jour le plus récent vers le passé : le 1er jour avec un gain positif gagne.
  for (let i = days.length - 1; i >= 1; i--) {
    let gain = 0;
    let names = [];
    for (const p of eod) {
      if (p.totals[i] == null || p.totals[i - 1] == null) continue;
      const g = p.totals[i] - p.totals[i - 1];
      if (g <= 0) continue;
      if (g > gain) { gain = g; names = [p.name]; }
      else if (g === gain) names.push(p.name);
    }
    if (gain > 0) return { names: [...new Set(names)], gain, day: days[i] };
  }
  return null;
}
