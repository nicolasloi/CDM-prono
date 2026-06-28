import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBracket, kosort } from '../scripts/lib/bracket.mjs';

test('kosort encode mois+jour+heure, comparable', () => {
  assert.equal(kosort('28 juin | 21:00'), 6282100);
  assert.ok(kosort('5 juillet | 18:00') > kosort('28 juin | 21:00'));
});

test('16es = affiches officielles, tours suivants en emplacements vides', () => {
  const r = buildBracket([], []);
  assert.deepEqual(r.map((x) => x.name), ['16es de finale', '8es de finale', 'Quarts', 'Demies', 'Finale']);
  assert.deepEqual(r.map((x) => x.ties.length), [16, 8, 4, 2, 1]);
  assert.equal(r[0].ties.every((t) => !t.placeholder), true);
  assert.equal(r[0].ties[0].home, 'Allemagne');
  assert.equal(r[1].ties.every((t) => t.placeholder), true);
});

test('un 16e joué affiche son score dans le bon slot', () => {
  const m = [{ date: '29 juin | 22:30', home: 'Allemagne', away: 'Paraguay', actualHome: 2, actualAway: 0, picks: [] }];
  const r = buildBracket(m, []);
  assert.equal(r[0].ties[0].actualHome, 2); // slot 0 = Allemagne/Paraguay
});

test('un 8e (équipes de 2 16es voisins) tombe au bon tour/slot', () => {
  const m = [{ date: '5 juillet | 18:00', home: 'Allemagne', away: 'France', actualHome: 1, actualAway: 0, picks: [] }];
  const r = buildBracket(m, []);
  assert.equal(r[1].ties[0].home, 'Allemagne'); // 8es slot 0
});

test('un match de POULE entre 2 équipes qualifiées n’est pas pris pour la finale', () => {
  // Algérie et Autriche sont dans des moitiés différentes → se "rencontreraient" en finale,
  // mais leur match de poule (28 juin matin) doit être exclu.
  const m = [{ date: '28 juin | 04:00', home: 'Algérie', away: 'Autriche', actualHome: 3, actualAway: 3, picks: [] }];
  const r = buildBracket(m, []);
  assert.equal(r[4].ties[0].placeholder, true);
});
