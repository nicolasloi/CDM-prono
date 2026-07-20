import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundsToRecheck } from '../scripts/lib/predictions.mjs';

test('roundsToRecheck : couvre la bascule de tour (16es → 8es) au jour de la transition', () => {
  assert.deepEqual(roundsToRecheck(new Date('2026-07-04T10:30:00Z')), [25, 26, 28, 29, 30]);
});

test('roundsToRecheck : un seul tour en plein milieu d’une fenêtre', () => {
  assert.deepEqual(roundsToRecheck(new Date('2026-07-01T12:00:00Z')), [25, 28, 29, 30]);
  assert.deepEqual(roundsToRecheck(new Date('2026-07-10T12:00:00Z')), [27, 28, 29, 30]);
});

test('roundsToRecheck : couvre aussi la transition finale 3e place → finale', () => {
  assert.deepEqual(roundsToRecheck(new Date('2026-07-19T12:00:00Z')), [28, 29, 30]);
});

test('roundsToRecheck : demies/3e place/finale toujours revérifiées même hors fenêtre officielle', () => {
  // Une fois leur fenêtre passée, la page par défaut de RTS ne montre plus que le tour "actuel"
  // (la finale) — sans ce filet, un tour raté pendant sa fenêtre devient irrécupérable.
  assert.deepEqual(roundsToRecheck(new Date('2026-07-25T12:00:00Z')), [28, 29, 30]);
});

