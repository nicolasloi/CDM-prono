// Tableau (bracket) de la phase finale, structure OFFICIELLE câblée d'après le bracket
// CDM 2026. Les 16es sont dans l'ordre de l'arbre (binaire, paires adjacentes) :
// le vainqueur de la paire (2i, 2i+1) avance au 8e i, etc. jusqu'à la finale.
// Données RTS en heure suisse (CEST) ; noms d'équipes en français (cf. RTS).
import { sortKey, whenLabel } from './datetime.mjs';

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
// Dates officielles par tour (repli si le créneau précis d'une case est inconnu).
const ROUND_DATE = ['', '4–7 juil.', '9–11 juil.', '14–15 juil.', '19 juil.'];
// Calendrier officiel FIFA (heure suisse CEST = heure US Est + 6 h), case par case et par tour,
// en attendant que RTS publie chaque tour avec l'horaire exact (RTS prime alors). Ordre = slots
// du tableau (cf. R32 / arbre binaire). Les 16es (tour 0) sont fournis par RTS → null.
// kickoff ISO inclus pour pouvoir trier ces cases avec les autres affiches « à venir ».
const SCHEDULE = [
  null,
  [
    ['4 juil. · 23:00', '2026-07-04T23:00:00+02:00'], ['4 juil. · 19:00', '2026-07-04T19:00:00+02:00'],
    ['6 juil. · 21:00', '2026-07-06T21:00:00+02:00'], ['7 juil. · 02:00', '2026-07-07T02:00:00+02:00'],
    ['5 juil. · 22:00', '2026-07-05T22:00:00+02:00'], ['6 juil. · 02:00', '2026-07-06T02:00:00+02:00'],
    ['7 juil. · 18:00', '2026-07-07T18:00:00+02:00'], ['7 juil. · 22:00', '2026-07-07T22:00:00+02:00'],
  ],
  [
    ['9 juil. · 22:00', '2026-07-09T22:00:00+02:00'], ['10 juil. · 21:00', '2026-07-10T21:00:00+02:00'],
    ['11 juil. · 23:00', '2026-07-11T23:00:00+02:00'], ['12 juil. · 03:00', '2026-07-12T03:00:00+02:00'],
  ],
  [['14 juil. · 21:00', '2026-07-14T21:00:00+02:00'], ['15 juil. · 21:00', '2026-07-15T21:00:00+02:00']],
  [['19 juil. · 21:00', '2026-07-19T21:00:00+02:00']],
];
const slotWhen = (r, slot) => (SCHEDULE[r] && SCHEDULE[r][slot]?.[0]) || ROUND_DATE[r] || null;
const slotKickoff = (r, slot) => (SCHEDULE[r] && SCHEDULE[r][slot]?.[1]) || null;

const norm = (s) => (s || '').toLowerCase().replace(/[’']/g, "'").trim();

// Vainqueurs aux tirs au but des matchs nuls de la phase finale (RTS ne les expose pas ;
// on les renseigne à la main). Clé : "domicile|extérieur" (normalisés).
// winner: 'home' | 'away' ; home/away : score de la séance de tirs au but.
const SHOOTOUT = {
  'allemagne|paraguay': { winner: 'away', home: 3, away: 4 },
  'pays-bas|maroc': { winner: 'away', home: 2, away: 3 },
  'australie|egypte': { winner: 'away', home: 2, away: 4 },
  'suisse|colombie': { winner: 'home', home: 4, away: 3 },
};

const shootoutFor = (home, away) => SHOOTOUT[norm(home) + '|' + norm(away)] || null;

// Place une affiche (home,away) dans le tableau : tour = plus petit r où les deux équipes
// partagent le même sous-arbre ; slot = index dans ce tour. null si une équipe n'est pas en phase finale.
function placeOf(home, away, teamTie) {
  const th = teamTie.get(norm(home)), ta = teamTie.get(norm(away));
  if (th == null || ta == null) return null;
  for (let r = 0; r < 5; r++) if ((th >> r) === (ta >> r)) return { r, slot: th >> r };
  return null;
}

// Vainqueur d'une affiche décidée : 'home' | 'away' | null (non décidée / nul sans t.a.b. connu).
function tieWinner(t) {
  if (t == null || t.actualHome == null || t.actualAway == null) return null;
  if (t.actualHome > t.actualAway) return 'home';
  if (t.actualAway > t.actualHome) return 'away';
  const s = shootoutFor(t.home, t.away);
  return s ? s.winner : null;
}

// matches: matches.json ; fixtures: fixtures.json.upcoming → [{ home, away, ... }]
export function buildBracket(matches = [], fixtures = []) {
  const teamTie = new Map();
  R32.forEach((pair, i) => pair.forEach((t) => teamTie.set(norm(t), i)));

  const rounds = ROUND_NAMES.map((name, r) => ({
    name,
    date: ROUND_DATE[r],
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
    if (sortKey(m.date) < KO_START) continue;
    const p = placeOf(m.home, m.away, teamTie);
    if (!p) continue;
    const sh = shootoutFor(m.home, m.away);
    rounds[p.r].ties[p.slot] = { ...m, picks: m.picks || [], penHome: sh?.home ?? null, penAway: sh?.away ?? null };
  }

  // Propagation : le vainqueur d'une affiche décidée avance directement dans la case du tour
  // suivant. On renseigne aussi la « provenance » (les 2 équipes potentielles) pour afficher
  // le prochain match dès que les affiches d'origine sont connues.
  for (let r = 0; r < rounds.length - 1; r++) {
    rounds[r].ties.forEach((t, s) => {
      if (!t || t.placeholder) return;
      const pslot = s >> 1;
      let parent = rounds[r + 1].ties[pslot];
      if (parent && parent.actualHome != null) return; // match suivant déjà joué → on n'y touche pas
      if (!parent || parent.placeholder) {
        parent = rounds[r + 1].ties[pslot] = { upcoming: true, picks: [], when: slotWhen(r + 1, pslot), kickoff: slotKickoff(r + 1, pslot) };
      }
      const side = s % 2 === 0 ? 'home' : 'away'; // enfant pair = haut = domicile
      if (t.home && t.away) parent[side + 'From'] = { home: t.home, away: t.away };
      const w = tieWinner(t);
      if (w) {
        parent[side] = w === 'home' ? t.home : t.away;
        parent[side + 'Flag'] = w === 'home' ? t.homeFlag : t.awayFlag;
      }
    });
  }

  // Équipes définitivement éliminées (ont perdu n'importe quel match de la phase finale) : sert à
  // griser tout leur PARCOURS dans le tableau, pas seulement le match où elles sont sorties — une
  // équipe qui gagne son 16e puis perd son 8e doit apparaître grisée aux DEUX tours, pas seulement
  // au 8e (sinon sa victoire au 16e reste dorée alors qu'elle est hors course).
  const eliminated = new Set();
  for (const r of rounds) {
    for (const t of r.ties) {
      if (!t || t.placeholder || t.actualHome == null || t.actualAway == null) continue;
      const w = tieWinner(t);
      if (!w) continue; // nul sans t.a.b. connu : personne de marqué éliminé pour l'instant
      const loser = w === 'home' ? t.away : t.home;
      if (loser) eliminated.add(norm(loser));
    }
  }
  for (const r of rounds) {
    for (const t of r.ties) {
      if (!t || t.placeholder) continue;
      if (t.home && eliminated.has(norm(t.home))) t.homeOut = true;
      if (t.away && eliminated.has(norm(t.away))) t.awayOut = true;
    }
  }

  return rounds;
}

// Créneau officiel du match pour la 3e place (Hard Rock Stadium, Miami — la veille de la
// finale), câblé comme le reste du calendrier tant que RTS ne l'a pas publié lui-même.
const THIRD_PLACE_WHEN = '18 juil. · 23:00';
const THIRD_PLACE_KICKOFF = '2026-07-18T23:00:00+02:00';

const sameTie = (m, home, away) =>
  (norm(m.home) === norm(home) && norm(m.away) === norm(away)) || (norm(m.home) === norm(away) && norm(m.away) === norm(home));

// Match pour la 3e place : oppose les 2 PERDANTS des demi-finales. Ne peut PAS passer par
// placeOf/teamTie comme le reste du tableau : à ce niveau de l'arbre (r=4), n'importe quelle
// paire de demi-finalistes retombe dans le même slot que la Finale (th>>4 et ta>>4 valent
// toujours 0 pour des indices 0..15) — donc construit à part, par recherche directe dans
// matches/fixtures une fois les 2 perdants connus, sans passer par la boucle de propagation.
// rounds : sortie de buildBracket (rounds[3] = Demies, 2 ties) ; matches/fixtures : mêmes
// entrées que buildBracket.
export function buildThirdPlace(rounds, matches = [], fixtures = []) {
  const semis = rounds?.[3]?.ties || [];
  const tie = { upcoming: true, picks: [], when: THIRD_PLACE_WHEN, kickoff: THIRD_PLACE_KICKOFF };
  const sides = ['home', 'away'];
  semis.forEach((s, i) => {
    const side = sides[i];
    if (!s || s.placeholder || !side) return;
    if (s.actualHome != null) {
      const w = tieWinner(s);
      if (!w) return; // nul sans t.a.b. connu : perdant pas déterminable pour l'instant
      const loserSide = w === 'home' ? 'away' : 'home';
      tie[side] = s[loserSide];
      tie[side + 'Flag'] = s[loserSide + 'Flag'];
    } else if (s.home && s.away) {
      tie[side + 'From'] = { home: s.home, away: s.away }; // demie pas encore jouée : provenance seule
    }
  });
  if (!tie.home || !tie.away) return tie; // au moins 1 perdant encore inconnu

  const found = matches.find((m) => sameTie(m, tie.home, tie.away));
  if (found) {
    const flip = norm(found.home) !== norm(tie.home);
    const sh = shootoutFor(tie.home, tie.away);
    return {
      home: tie.home, away: tie.away, homeFlag: tie.homeFlag, awayFlag: tie.awayFlag,
      date: found.date, stadium: found.stadium,
      actualHome: flip ? found.actualAway : found.actualHome,
      actualAway: flip ? found.actualHome : found.actualAway,
      picks: found.picks || [],
      penHome: sh?.home ?? null, penAway: sh?.away ?? null,
    };
  }
  const fx = fixtures.find((f) => sameTie(f, tie.home, tie.away));
  if (fx) tie.when = whenLabel(fx);
  return tie;
}
