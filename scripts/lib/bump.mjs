// Construit les données du bump chart : la position de chaque joueur au classement, par JOURNÉE de match
// (créneau midi→midi CEST, cf. matchDay) — une soirée/nuit de matchs = une seule colonne.
// On prend la dernière position connue de chaque journée et on reporte les journées manquantes.
import { matchDay as dayOf } from './datetime.mjs';

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
