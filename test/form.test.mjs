import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topMover } from '../scripts/lib/form.mjs';

const H = 3600 * 1000;
const base = Date.parse('2026-06-22T12:00:00Z');
const at = (h, pts, name) => ({ takenAt: new Date(base + h * H).toISOString(), totalPoints: pts, name });

test('plus gros gain sur 24h', () => {
  const ts = {
    a: [at(-30, 10, 'A'), at(-20, 12, 'A'), at(0, 30, 'A')], // baseline = relevé à -30h (≤ -24h) → 30-10 ? non : ≤ cutoff(-24h) = -30h → 10 ; gain 20
    b: [at(-30, 5, 'B'), at(-1, 8, 'B'), at(0, 20, 'B')],     // baseline -30h = 5 ; gain 15
  };
  const m = topMover(ts);
  assert.equal(m.name, 'A');
  assert.equal(m.gain, 20);
});

test('null si personne ne progresse', () => {
  const ts = { a: [at(-2, 10, 'A'), at(0, 10, 'A')] };
  assert.equal(topMover(ts), null);
});

test('série trop courte ignorée', () => {
  const ts = { a: [at(0, 10, 'A')] };
  assert.equal(topMover(ts), null);
});
