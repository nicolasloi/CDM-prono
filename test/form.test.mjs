import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topMover } from '../scripts/lib/form.mjs';

const at = (iso, pts, name) => ({ takenAt: iso, totalPoints: pts, name });
// Journées coupées à midi CEST. 20:00 UTC = 22:00 CEST (soir) → journée du jour même.

test('gain sur la dernière journée active', () => {
  const ts = {
    a: [at('2026-06-22T20:00:00Z', 10, 'A'), at('2026-06-23T20:00:00Z', 30, 'A')],
    b: [at('2026-06-22T20:00:00Z', 8, 'B'), at('2026-06-23T20:00:00Z', 15, 'B')],
  };
  const m = topMover(ts);
  assert.deepEqual(m.names, ['A']);
  assert.equal(m.gain, 20);
  assert.equal(m.day, '2026-06-23');
});

test('ignore les journées sans changement (remonte au dernier jour actif)', () => {
  const ts = {
    a: [at('2026-06-22T20:00:00Z', 10, 'A'), at('2026-06-23T20:00:00Z', 30, 'A'), at('2026-06-24T20:00:00Z', 30, 'A')],
    b: [at('2026-06-22T20:00:00Z', 8, 'B'), at('2026-06-23T20:00:00Z', 15, 'B'), at('2026-06-24T20:00:00Z', 15, 'B')],
  };
  const m = topMover(ts);
  assert.equal(m.day, '2026-06-23'); // le 24 n'a pas bougé → on prend le 23
  assert.equal(m.gain, 20);
});

test('ex æquo : tous les noms au sommet', () => {
  const ts = {
    a: [at('2026-06-22T20:00:00Z', 10, 'A'), at('2026-06-23T20:00:00Z', 20, 'A')],
    b: [at('2026-06-22T20:00:00Z', 5, 'B'), at('2026-06-23T20:00:00Z', 15, 'B')],
  };
  const m = topMover(ts);
  assert.deepEqual(m.names.sort(), ['A', 'B']);
  assert.equal(m.gain, 10);
});

test('null si une seule journée', () => {
  const ts = { a: [at('2026-06-23T20:00:00Z', 10, 'A')] };
  assert.equal(topMover(ts), null);
});
