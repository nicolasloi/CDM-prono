import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scorePrediction, ghostTotal } from '../scripts/lib/scoring.mjs';

test('score exact en groupes = 5+1+3 = 9', () => {
  assert.equal(scorePrediction({ home: 2, away: 1 }, { home: 2, away: 1 }), 9);
});
test('bon vainqueur seul = 5', () => {
  assert.equal(scorePrediction({ home: 2, away: 0 }, { home: 1, away: 0 }), 5);
});
test('bon vainqueur + bonne diff, mauvais total = 5+3 = 8', () => {
  assert.equal(scorePrediction({ home: 2, away: 0 }, { home: 3, away: 1 }), 8);
});
test('mauvais vainqueur mais bon total de buts = 1', () => {
  assert.equal(scorePrediction({ home: 0, away: 1 }, { home: 1, away: 0 }), 1);
});
test('nul exact = 9', () => {
  assert.equal(scorePrediction({ home: 1, away: 1 }, { home: 1, away: 1 }), 9);
});
test('barème phases finales : exact = 10+2+6 = 18', () => {
  assert.equal(scorePrediction({ home: 2, away: 1 }, { home: 2, away: 1 }, 'knockout'), 18);
});
test('ghostTotal somme les pronos avec résultat connu (stage pris en compte)', () => {
  const preds = [
    { result: { home: 2, away: 1 }, actual: { home: 2, away: 1 }, stage: 'group' },
    { result: { home: 1, away: 0 }, actual: { home: 0, away: 0 }, stage: 'group' },
    { result: { home: 1, away: 1 }, actual: null, stage: 'group' },
  ];
  assert.equal(ghostTotal(preds), 9);
});
