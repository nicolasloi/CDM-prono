import { test } from 'node:test';
import assert from 'node:assert/strict';
import { biggestClimber, momentum, badges } from '../scripts/lib/stats.mjs';

const ts = {
  a: [ { totalPoints: 5, rank: 2, name: 'A' }, { totalPoints: 7, rank: 2, name: 'A' }, { totalPoints: 14, rank: 1, name: 'A' } ],
  b: [ { totalPoints: 6, rank: 1, name: 'B' }, { totalPoints: 9, rank: 1, name: 'B' }, { totalPoints: 10, rank: 2, name: 'B' } ],
};

test('biggestClimber = plus gros gain de points sur le dernier pas', () => {
  const c = biggestClimber(ts);
  assert.equal(c.name, 'A');
  assert.equal(c.gain, 7);
});

test('momentum = somme des gains sur les 2 derniers pas', () => {
  assert.equal(momentum(ts.a), 9);
});

test('badges attribue La Remontada au meilleur grimpeur de rang', () => {
  const b = badges(ts);
  const remontada = b.find((x) => x.label === 'La Remontada');
  assert.equal(remontada.name, 'A');
});
