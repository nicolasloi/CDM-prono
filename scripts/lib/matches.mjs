// Pivot des pronos par match : pour chaque match, qui a misé quoi (les 7 membres) + résultat.
import { flagFor } from './flags.mjs';
import { sortKey, toISO } from './datetime.mjs';

// byId: { <id>: { name, matches:[...] } } → tableau de matchs (plus récent d'abord),
// chacun avec ses pronos par membre.
export function buildMatches(byId) {
  const map = new Map();
  for (const [id, p] of Object.entries(byId)) {
    for (const m of p.matches) {
      const key = `${m.home}|${m.away}`;
      if (!map.has(key)) {
        map.set(key, {
          date: m.date,
          kickoff: toISO(m.date),
          home: m.home, away: m.away,
          homeFlag: flagFor(m.home), awayFlag: flagFor(m.away),
          stadium: m.stadium,
          actualHome: m.actualHome, actualAway: m.actualAway,
          picks: [],
        });
      }
      const match = map.get(key);
      // le résultat est commun à tous : on le garde s'il est connu
      if (match.actualHome === null && m.actualHome !== null) { match.actualHome = m.actualHome; match.actualAway = m.actualAway; }
      match.picks.push({ id, name: p.name, predHome: m.predHome, predAway: m.predAway, points: m.points });
    }
  }
  const matches = [...map.values()];
  for (const mt of matches) mt.picks.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  matches.sort((a, b) => sortKey(b.date) - sortKey(a.date));
  return matches;
}
