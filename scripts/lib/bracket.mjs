// Regroupe les matchs de phase finale (à partir du 28 juin) par tour, pour le tableau.
// Les dates des tours de la CDM 2026 : 16es 28/6–3/7, 8es 4–7/7, quarts 9–11/7,
// demies 14–15/7, 3e place + finale 18–19/7.
const MONTHS = { juin: 6, juillet: 7 };

// "28 juin | 04:00" -> 628 ; "3 juillet | 21:00" -> 703 (mois*100 + jour, triable)
export function dnum(date) {
  const m = /^(\d+)\s+(\S+)/.exec(date || '');
  if (!m) return 0;
  return (MONTHS[m[2]] || 0) * 100 + Number(m[1]);
}

const ROUNDS = [
  { name: '16es de finale', from: 628, to: 703 },
  { name: '8es de finale', from: 704, to: 707 },
  { name: 'Quarts', from: 709, to: 711 },
  { name: 'Demies', from: 714, to: 715 },
  { name: 'Finale', from: 718, to: 719 },
];

// matches: tableau de matchs (cf. matches.json) → [{ name, ties:[match,...] }]
// (uniquement les tours qui ont au moins un match).
export function buildBracket(matches = []) {
  const rounds = ROUNDS.map((r) => ({ name: r.name, ties: [] }));
  for (const mt of matches) {
    const d = dnum(mt.date);
    const i = ROUNDS.findIndex((r) => d >= r.from && d <= r.to);
    if (i !== -1) rounds[i].ties.push(mt);
  }
  for (const r of rounds) r.ties.sort((a, b) => dnum(a.date) - dnum(b.date));
  return rounds.filter((r) => r.ties.length);
}
