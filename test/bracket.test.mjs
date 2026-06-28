import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBracket, dnum } from '../scripts/lib/bracket.mjs';

const mk = (date, home, away) => ({ date, home, away, actualHome: null, actualAway: null, picks: [] });

test('dnum encode mois+jour, triable', () => {
  assert.equal(dnum('28 juin | 04:00'), 628);
  assert.equal(dnum('3 juillet | 21:00'), 703);
  assert.ok(dnum('3 juillet | 21:00') > dnum('28 juin | 04:00'));
});

test('regroupe par tour et ignore les matchs de poule', () => {
  const matches = [
    mk('19 juin | 21:00', 'France', 'Irak'),      // poule → ignoré
    mk('28 juin | 04:00', 'Algérie', 'Autriche'), // 16es
    mk('3 juillet | 21:00', 'Brésil', 'Maroc'),   // 16es
    mk('5 juillet | 18:00', 'Espagne', 'Suisse'), // 8es
    mk('19 juillet | 17:00', 'A', 'B'),           // finale
  ];
  const r = buildBracket(matches);
  assert.deepEqual(r.map((x) => x.name), ['16es de finale', '8es de finale', 'Finale']);
  assert.equal(r[0].ties.length, 2);
  assert.equal(r[0].ties[0].home, 'Algérie'); // trié par date
});

test('tableau vide si aucun match de phase finale', () => {
  assert.deepEqual(buildBracket([mk('19 juin | 21:00', 'France', 'Irak')]), []);
});
