// Regroupe les matchs de phase finale par tour, pour le tableau.
// ATTENTION fuseaux : les données RTS sont en heure suisse (CEST). Les derniers
// matchs de POULE tombent le 28 juin au petit matin CEST (matchs US du 27/6 au soir).
// Les 16es de finale commencent le 28 juin en soirée CEST. On coupe donc à midi le 28.
const MONTHS = { juin: 6, juillet: 7 };

// "28 juin | 21:00" -> 6282100  (mois*1e6 + jour*1e4 + hh*100 + mm, triable/comparable)
export function kosort(date) {
  const m = /^(\d+)\s+(\S+)\s*\|\s*(\d+):(\d+)/.exec(date || '');
  if (m) return (MONTHS[m[2]] || 0) * 1e6 + Number(m[1]) * 1e4 + Number(m[3]) * 100 + Number(m[4]);
  const d = /^(\d+)\s+(\S+)/.exec(date || '');
  return d ? (MONTHS[d[2]] || 0) * 1e6 + Number(d[1]) * 1e4 : 0;
}

// Début des 16es : 28 juin 12:00 CEST.
const KO_START = 6281200;

// Bornes par tour (CEST, approximatives mais sans chevauchement — il y a des jours de repos).
const ROUNDS = [
  { name: '16es de finale', from: 6281200, to: 7050000 }, // 28/6 → 4/7
  { name: '8es de finale', from: 7050000, to: 7090000 },  // 5/7 → 8/7
  { name: 'Quarts', from: 7090000, to: 7130000 },          // 9/7 → 12/7
  { name: 'Demies', from: 7130000, to: 7170000 },          // 13/7 → 16/7
  { name: 'Finale', from: 7170000, to: 8000000 },          // 17/7 →
];

// matches: tableau de matchs (cf. matches.json) → [{ name, ties:[match,...] }]
// (uniquement les vrais matchs de phase finale, et les tours non vides).
export function buildBracket(matches = []) {
  const rounds = ROUNDS.map((r) => ({ name: r.name, ties: [] }));
  for (const mt of matches) {
    const k = kosort(mt.date);
    if (k < KO_START) continue; // exclut les matchs de poule
    const i = ROUNDS.findIndex((r) => k >= r.from && k < r.to);
    if (i !== -1) rounds[i].ties.push(mt);
  }
  for (const r of rounds) r.ties.sort((a, b) => kosort(a.date) - kosort(b.date));
  return rounds.filter((r) => r.ties.length);
}
