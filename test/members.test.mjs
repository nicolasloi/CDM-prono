import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shortName, buildColorMap } from '../scripts/lib/members.mjs';

test('shortName retire l\'initiale du nom de famille', () => {
  assert.equal(shortName('Nicolas L'), 'Nicolas');
  assert.equal(shortName('Joao M'), 'Joao');
  assert.equal(shortName('Mica P'), 'Mica');
});

test('shortName conserve un nom de famille écrit en entier', () => {
  assert.equal(shortName('Vitor Pinto'), 'Vitor Pinto');
});

test('shortName robuste (vide / mononyme)', () => {
  assert.equal(shortName(''), '');
  assert.equal(shortName('Ronaldinho'), 'Ronaldinho');
});

test('buildColorMap est stable et déterministe', () => {
  const a = buildColorMap(['b', 'a', 'c']);
  const b = buildColorMap(['c', 'a', 'b']);
  assert.deepEqual(a, b); // même affectation quel que soit l'ordre d'entrée
});
