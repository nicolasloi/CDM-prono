// Construit le tableau (bracket) de la phase finale, type BBC : une colonne par tour,
// avec toutes les affiches connues + des emplacements vides pour la structure à venir.
// Données RTS en heure suisse (CEST). Les derniers matchs de POULE tombent le 28 juin
// au matin CEST → on coupe à midi le 28. Les affiches des 16es viennent de fixtures.json
// (matchs à venir) et les matchs joués/en cours de matches.json.
const MONTHS = { juin: 6, juillet: 7 };

// "28 juin | 21:00" -> 6282100 (mois*1e6 + jour*1e4 + hh*100 + mm), comparable/triable.
export function kosort(date) {
  const m = /^(\d+)\s+(\S+)\s*\|\s*(\d+):(\d+)/.exec(date || '');
  if (m) return (MONTHS[m[2]] || 0) * 1e6 + Number(m[1]) * 1e4 + Number(m[3]) * 100 + Number(m[4]);
  const d = /^(\d+)\s+(\S+)/.exec(date || '');
  return d ? (MONTHS[d[2]] || 0) * 1e6 + Number(d[1]) * 1e4 : 0;
}

export const KO_START = 6281200; // 28 juin 12:00 CEST

const teamKey = (h, a) => `${h}|${a}`;

// Tours : nom, nombre de matchs, et bornes CEST (approx, sans chevauchement — jours de repos).
const ROUNDS = [
  { name: '16es de finale', size: 16, from: 6281200, to: 7050000 },
  { name: '8es de finale', size: 8, from: 7050000, to: 7090000 },
  { name: 'Quarts', size: 4, from: 7090000, to: 7130000 },
  { name: 'Demies', size: 2, from: 7130000, to: 7170000 },
  { name: 'Finale', size: 1, from: 7170000, to: 8000000 },
];

// matches: matches.json ; fixtures: fixtures.json.upcoming
// → [{ name, ties:[...] }] avec ties = matchs réels + emplacements vides ({placeholder:true}).
export function buildBracket(matches = [], fixtures = []) {
  const played = matches.filter((m) => kosort(m.date) >= KO_START);
  const seen = new Set(played.map((m) => teamKey(m.home, m.away)));
  // Affiches à venir (pas encore jouées) = le tour courant des fixtures (les 16es pour l'instant).
  const upcoming = fixtures
    .filter((f) => !seen.has(teamKey(f.home, f.away)))
    .map((f) => ({ ...f, upcoming: true, picks: [] }));

  const rounds = ROUNDS.map((r) => ({ name: r.name, ties: [] }));
  for (const m of played) {
    const i = ROUNDS.findIndex((r) => kosort(m.date) >= r.from && kosort(m.date) < r.to);
    if (i !== -1) rounds[i].ties.push(m);
  }
  rounds[0].ties.push(...upcoming); // les fixtures connues sont les 16es

  for (let ri = 0; ri < rounds.length; ri++) {
    rounds[ri].ties.sort((a, b) => kosort(a.date) - kosort(b.date));
    // Complète avec des emplacements vides pour dessiner la structure (BBC).
    for (let i = rounds[ri].ties.length; i < ROUNDS[ri].size; i++) rounds[ri].ties.push({ placeholder: true });
  }
  return rounds;
}
