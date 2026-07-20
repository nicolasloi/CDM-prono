import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBracket } from '../scripts/lib/bracket.mjs';
import { sortKey } from '../scripts/lib/datetime.mjs';

test('sortKey encode mois+jour+heure, comparable (gère « juil. » abrégé)', () => {
  assert.equal(sortKey('28 juin | 21:00'), 6282100);
  assert.ok(sortKey('5 juillet | 18:00') > sortKey('28 juin | 21:00'));
  assert.ok(sortKey('1 juil. | 18:00') > sortKey('28 juin | 21:00')); // mois abrégé RTS
});

test('16es = affiches officielles ; tours suivants « à venir » avec équipes potentielles', () => {
  const r = buildBracket([], []);
  assert.deepEqual(r.map((x) => x.name), ['16es de finale', '8es de finale', 'Quarts', 'Demies', 'Finale']);
  assert.deepEqual(r.map((x) => x.ties.length), [16, 8, 4, 2, 1]);
  assert.equal(r[0].ties.every((t) => !t.placeholder), true);
  assert.equal(r[0].ties[0].home, 'Allemagne');
  // Sans résultat, les 8es sont « à venir » et affichent la provenance (les 2 équipes potentielles).
  assert.equal(r[1].ties.every((t) => t.upcoming && t.actualHome == null), true);
  assert.deepEqual(r[1].ties[0].homeFrom, { home: 'Allemagne', away: 'Paraguay' });
  assert.deepEqual(r[1].ties[0].awayFrom, { home: 'France', away: 'Suède' });
  // Créneau officiel câblé sur la case (heure suisse), + kickoff ISO pour le tri chrono
  // avec les autres affiches « à venir » (onglet Matchs).
  assert.equal(r[1].ties[0].when, '4 juil. · 23:00');
  assert.equal(r[1].ties[0].kickoff, '2026-07-04T23:00:00+02:00');
  // Tours lointains sans aucune affiche connue (ex. demies) : provenance vide (pas de "?" inventé).
  assert.equal(r[3].ties[0].homeFrom, undefined);
  assert.equal(r[3].ties[0].kickoff, '2026-07-14T21:00:00+02:00');
});

test('un 16e joué affiche son score dans le bon slot', () => {
  const m = [{ date: '29 juin | 22:30', home: 'Allemagne', away: 'Paraguay', actualHome: 2, actualAway: 0, picks: [] }];
  const r = buildBracket(m, []);
  assert.equal(r[0].ties[0].actualHome, 2); // slot 0 = Allemagne/Paraguay
});

test('le vainqueur d’un 16e avance directement dans la case du 8e', () => {
  const m = [{ date: '4 juil. | 18:00', home: 'Allemagne', away: 'Paraguay', actualHome: 2, actualAway: 0, picks: [] }];
  const r = buildBracket(m, []);
  assert.equal(r[1].ties[0].home, 'Allemagne'); // gagnant placé en haut du 8e slot 0
});

test('match nul en phase finale : le qualifié aux t.a.b. avance', () => {
  // Allemagne 1-1 Paraguay → Paraguay qualifié aux tirs au but (câblé), avance au 8e.
  const m = [{ date: '29 juin | 22:30', home: 'Allemagne', away: 'Paraguay', actualHome: 1, actualAway: 1, picks: [] }];
  const r = buildBracket(m, []);
  assert.equal(r[1].ties[0].home, 'Paraguay');
});

test('un 8e (équipes de 2 16es voisins) tombe au bon tour/slot', () => {
  const m = [{ date: '5 juillet | 18:00', home: 'Allemagne', away: 'France', actualHome: 1, actualAway: 0, picks: [] }];
  const r = buildBracket(m, []);
  assert.equal(r[1].ties[0].home, 'Allemagne'); // 8es slot 0
});

test('équipe éliminée : marquée « out » sur TOUT son parcours, y compris ses victoires antérieures', () => {
  // Paraguay gagne son 16e (vs Allemagne) puis perd son 8e (vs France) → doit être marqué
  // homeOut/awayOut aux DEUX tours, pas seulement au 8e où il sort.
  const m = [
    { date: '29 juin | 22:30', home: 'Allemagne', away: 'Paraguay', actualHome: 1, actualAway: 2, picks: [] },
    { date: '4 juil. | 23:00', home: 'Paraguay', away: 'France', actualHome: 0, actualAway: 1, picks: [] },
  ];
  const r = buildBracket(m, []);
  assert.equal(r[0].ties[0].awayOut, true); // Paraguay (away) a gagné ce 16e mais est éliminé plus tard
  assert.equal(r[1].ties[0].homeOut, true); // Paraguay (home) a perdu ce 8e
  // Allemagne (éliminée dès le 16e, jamais gagné) : marquée out sur son unique apparition.
  assert.equal(r[0].ties[0].homeOut, true);
  // France (toujours en lice) : jamais marquée out.
  assert.equal(r[1].ties[0].awayOut, undefined);
});

test('un match de POULE entre 2 équipes qualifiées n’est pas pris pour la finale', () => {
  // Algérie et Autriche sont dans des moitiés différentes → se "rencontreraient" en finale,
  // mais leur match de poule (28 juin matin) doit être exclu (aucun résultat en finale).
  const m = [{ date: '28 juin | 04:00', home: 'Algérie', away: 'Autriche', actualHome: 3, actualAway: 3, picks: [] }];
  const r = buildBracket(m, []);
  assert.equal(r[4].ties[0].actualHome ?? null, null);
  assert.equal(r[4].ties[0].home ?? null, null);
});
