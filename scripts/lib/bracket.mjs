// Tableau (bracket) de la phase finale, structure OFFICIELLE câblée d'après le bracket
// CDM 2026. Les 16es sont dans l'ordre de l'arbre (binaire, paires adjacentes) :
// le vainqueur de la paire (2i, 2i+1) avance au 8e i, etc. jusqu'à la finale.
// Données RTS en heure suisse (CEST) ; noms d'équipes en français (cf. RTS).
import { whenLabel } from './datetime.mjs';

const MONTHS = { juin: 6, juillet: 7 };

export function kosort(date) {
  const m = /^(\d+)\s+(\S+)\s*\|\s*(\d+):(\d+)/.exec(date || '');
  if (m) return (MONTHS[m[2]] || 0) * 1e6 + Number(m[1]) * 1e4 + Number(m[3]) * 100 + Number(m[4]);
  const d = /^(\d+)\s+(\S+)/.exec(date || '');
  return d ? (MONTHS[d[2]] || 0) * 1e6 + Number(d[1]) * 1e4 : 0;
}
export const KO_START = 6281200; // 28 juin 12:00 CEST (exclut les derniers matchs de poule)

// 16es dans l'ordre du tableau (moitié gauche haut→bas, puis moitié droite haut→bas).
export const R32 = [
  ['Allemagne', 'Paraguay'], ['France', 'Suède'],
  ['Afrique du Sud', 'Canada'], ['Pays-Bas', 'Maroc'],
  ['Portugal', 'Croatie'], ['Espagne', 'Autriche'],
  ['USA', 'Bosnie-Herzégovine'], ['Belgique', 'Sénégal'],
  ['Brésil', 'Japon'], ["Côte d'Ivoire", 'Norvège'],
  ['Mexique', 'Equateur'], ['Angleterre', 'RD Congo'],
  ['Argentine', 'Cap Vert'], ['Australie', 'Egypte'],
  ['Suisse', 'Algérie'], ['Colombie', 'Ghana'],
];

const ROUND_NAMES = ['16es de finale', '8es de finale', 'Quarts', 'Demies', 'Finale'];
const norm = (s) => (s || '').toLowerCase().replace(/[’']/g, "'").trim();

// Place une affiche (home,away) dans le tableau : tour = plus petit r où les deux équipes
// partagent le même sous-arbre ; slot = index dans ce tour. null si une équipe n'est pas en phase finale.
function placeOf(home, away, teamTie) {
  const th = teamTie.get(norm(home)), ta = teamTie.get(norm(away));
  if (th == null || ta == null) return null;
  for (let r = 0; r < 5; r++) if ((th >> r) === (ta >> r)) return { r, slot: th >> r };
  return null;
}

// matches: matches.json ; fixtures: fixtures.json.upcoming → [{ name, ties:[...] }]
export function buildBracket(matches = [], fixtures = []) {
  const teamTie = new Map();
  R32.forEach((pair, i) => pair.forEach((t) => teamTie.set(norm(t), i)));

  const rounds = ROUND_NAMES.map((name, r) => ({
    name,
    ties: Array.from({ length: 16 >> r }, () => ({ placeholder: true })),
  }));
  // 16es : affiches officielles (à venir par défaut)
  R32.forEach((pair, i) => { rounds[0].ties[i] = { home: pair[0], away: pair[1], upcoming: true, picks: [] }; });

  // Affiches à venir (RTS) → leur slot (équipes connues = tour suivant qui se précise)
  for (const f of fixtures) {
    const p = placeOf(f.home, f.away, teamTie);
    if (p) rounds[p.r].ties[p.slot] = { home: f.home, away: f.away, homeFlag: f.homeFlag, awayFlag: f.awayFlag, stadium: f.stadium, upcoming: true, when: whenLabel(f), picks: [] };
  }
  // Matchs joués / en cours (priment) — uniquement la phase finale (exclut les poules)
  for (const m of matches) {
    if (kosort(m.date) < KO_START) continue;
    const p = placeOf(m.home, m.away, teamTie);
    if (p) rounds[p.r].ties[p.slot] = { ...m, picks: m.picks || [] };
  }
  return rounds;
}
