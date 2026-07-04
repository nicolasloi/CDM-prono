import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundsToRecheck } from '../scripts/lib/predictions.mjs';

test('roundsToRecheck : couvre la bascule de tour (16es → 8es) au jour de la transition', () => {
  assert.deepEqual(roundsToRecheck(new Date('2026-07-04T10:30:00Z')), [25, 26]);
});

test('roundsToRecheck : un seul tour en plein milieu d’une fenêtre', () => {
  assert.deepEqual(roundsToRecheck(new Date('2026-07-01T12:00:00Z')), [25]);
  assert.deepEqual(roundsToRecheck(new Date('2026-07-10T12:00:00Z')), [27]);
});

test('roundsToRecheck : couvre aussi la transition finale 3e place → finale', () => {
  assert.deepEqual(roundsToRecheck(new Date('2026-07-19T12:00:00Z')), [29, 30]);
});
