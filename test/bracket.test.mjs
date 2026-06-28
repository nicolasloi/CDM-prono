import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBracket, kosort } from '../scripts/lib/bracket.mjs';

const mk = (date, home, away, ah = null, aa = null) => ({ date, home, away, actualHome: ah, actualAway: aa, picks: [] });
const fx = (home, away) => ({ home, away });

test('kosort encode mois+jour+heure, comparable', () => {
  assert.equal(kosort('28 juin | 21:00'), 6282100);
  assert.ok(kosort('29 juin | 18:00') > kosort('28 juin | 21:00'));
});

test('5 tours, 16es = affiches à venir, autres tours en emplacements vides', () => {
  const fixtures = [fx('Espagne', 'Autriche'), fx('Brésil', 'Japon')];
  const r = buildBracket([], fixtures);
  assert.deepEqual(r.map((x) => x.name), ['16es de finale', '8es de finale', 'Quarts', 'Demies', 'Finale']);
  assert.deepEqual(r.map((x) => x.ties.length), [16, 8, 4, 2, 1]); // complété par des placeholders
  const real = r[0].ties.filter((t) => !t.placeholder);
  assert.equal(real.length, 2);
  assert.equal(r[1].ties.every((t) => t.placeholder), true); // 8es vides pour l'instant
});

test('un 16e joué remplace l’affiche à venir (pas de doublon) et exclut la poule', () => {
  const matches = [
    mk('19 juin | 21:00', 'France', 'Irak', 1, 0),      // poule → ignoré
    mk('28 juin | 21:00', 'Espagne', 'Autriche', 2, 1), // 16e joué
  ];
  const fixtures = [fx('Espagne', 'Autriche'), fx('Brésil', 'Japon')];
  const r = buildBracket(matches, fixtures);
  const real = r[0].ties.filter((t) => !t.placeholder);
  assert.equal(real.length, 2); // Espagne-Autriche (joué) + Brésil-Japon (à venir), pas de doublon
  const esp = real.find((t) => t.home === 'Espagne');
  assert.equal(esp.actualHome, 2); // version jouée, pas l'affiche
});
