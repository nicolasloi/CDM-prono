import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeActuals } from '../scripts/lib/pretournament.mjs';

test('matchsNuls compte tous les 0:0 (poules + phase finale)', () => {
  const matches = [
    { home: 'A', away: 'B', actualHome: 0, actualAway: 0 },
    { home: 'C', away: 'D', actualHome: 1, actualAway: 0 },
    { home: 'E', away: 'F', actualHome: 0, actualAway: 0 },
    { home: 'G', away: 'H', actualHome: null, actualAway: null },
  ];
  assert.equal(computeActuals(matches, []).matchsNuls, 2);
});

test('suisseButs additionne les buts marqués, domicile ou extérieur', () => {
  const matches = [
    { home: 'Suisse', away: 'X', actualHome: 3, actualAway: 1 },
    { home: 'Y', away: 'Suisse', actualHome: 1, actualAway: 2 },
    { home: 'Suisse', away: 'Z', actualHome: null, actualAway: null }, // pas encore joué → ignoré
  ];
  assert.equal(computeActuals(matches, []).suisseButs, 5);
});

test('suisseParcours : encore en lice au tour le plus profond où elle a joué', () => {
  const rounds = [
    { ties: [{ home: 'Suisse', away: 'Algérie', actualHome: 2, actualAway: 0 }] },
    { ties: [{ home: 'Suisse', away: 'Ghana', actualHome: null, actualAway: null }] },
    { ties: [{ placeholder: true }] },
    { ties: [{ placeholder: true }] },
    { ties: [{ placeholder: true }] },
  ];
  assert.equal(computeActuals([], rounds).suisseParcours, '8es de finale (en cours)');
});

test('suisseParcours : éliminée si le tour le plus profond joué est perdu', () => {
  const rounds = [
    { ties: [{ home: 'Suisse', away: 'Algérie', actualHome: 2, actualAway: 0 }] },
    { ties: [{ home: 'Suisse', away: 'Ghana', actualHome: 0, actualAway: 1 }] },
    { ties: [{ placeholder: true }] },
    { ties: [{ placeholder: true }] },
    { ties: [{ placeholder: true }] },
  ];
  assert.equal(computeActuals([], rounds).suisseParcours, 'éliminée en 8es de finale');
});
