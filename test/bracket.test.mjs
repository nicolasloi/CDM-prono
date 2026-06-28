import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBracket, kosort } from '../scripts/lib/bracket.mjs';

const mk = (date, home, away) => ({ date, home, away, actualHome: null, actualAway: null, picks: [] });

test('kosort encode mois+jour+heure, comparable', () => {
  assert.equal(kosort('28 juin | 21:00'), 6282100);
  assert.equal(kosort('4 juin | 04:00'), 6040400);
  assert.ok(kosort('29 juin | 18:00') > kosort('28 juin | 21:00'));
});

test('exclut les matchs de poule du 28 juin au matin, garde les 16es du soir', () => {
  const matches = [
    mk('19 juin | 21:00', 'France', 'Irak'),       // poule → ignoré
    mk('28 juin | 04:00', 'Algérie', 'Autriche'),  // dernière poule (matin) → ignoré
    mk('28 juin | 21:00', 'Afrique du Sud', 'Canada'), // 1er 16e (soir)
    mk('29 juin | 18:00', 'Brésil', 'Japon'),      // 16e
    mk('6 juillet | 18:00', 'Espagne', 'Suisse'),  // 8e
  ];
  const r = buildBracket(matches);
  assert.deepEqual(r.map((x) => x.name), ['16es de finale', '8es de finale']);
  assert.equal(r[0].ties.length, 2);
  assert.equal(r[0].ties[0].home, 'Afrique du Sud'); // trié par date/heure
});

test('tableau vide tant qu’aucun match de phase finale', () => {
  assert.deepEqual(buildBracket([mk('28 juin | 04:00', 'Algérie', 'Autriche')]), []);
});
