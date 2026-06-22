// Construit les données du bump chart : la position de chaque joueur au classement, par jour.
// On prend la dernière position connue de chaque jour (fuseau Europe/Zurich) et on reporte les jours manquants.
const dayOf = (iso) => new Date(iso).toLocaleDateString('fr-CA', { timeZone: 'Europe/Zurich' }); // "2026-06-12"

export function buildRankByDay(ts) {
  const daySet = new Set();
  for (const series of Object.values(ts)) for (const p of series) daySet.add(dayOf(p.takenAt));
  const days = [...daySet].sort();

  const byId = {};
  for (const [key, series] of Object.entries(ts)) {
    const lastByDay = {};
    for (const p of series) lastByDay[dayOf(p.takenAt)] = p.pos ?? p.rank; // dernière de la journée
    let carry = null;
    const positions = days.map((d) => { if (lastByDay[d] != null) carry = lastByDay[d]; return carry; });
    byId[key] = { name: series.at(-1)?.name, positions };
  }
  return { days, byId };
}
