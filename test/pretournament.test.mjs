import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeActuals, annotateLost } from '../scripts/lib/pretournament.mjs';

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

test('annotateLost : champion déjà éliminé → grisé', () => {
  const rounds = [
    { ties: [{ home: 'Brésil', away: 'Japon', actualHome: 0, actualAway: 1 }] }, // Brésil éliminé aux 16es
    { ties: [{ placeholder: true }] }, { ties: [{ placeholder: true }] },
    { ties: [{ placeholder: true }] }, { ties: [{ placeholder: true }] },
  ];
  const byId = { a: { champion: 'Brésil' }, b: { champion: 'Japon' } };
  const out = annotateLost(byId, rounds, {});
  assert.equal(out.a.lost.champion, true);
  assert.equal(out.b.lost.champion, undefined); // Japon toujours en lice → pas de flag
});

test('annotateLost : parcours Suisse encore possible vs déjà dépassé', () => {
  const rounds = [
    { ties: [{ home: 'Suisse', away: 'Algérie', actualHome: 2, actualAway: 0 }] },
    { ties: [{ home: 'Suisse', away: 'Ghana', actualHome: null, actualAway: null }] }, // encore en lice au 8e
    { ties: [{ placeholder: true }] }, { ties: [{ placeholder: true }] }, { ties: [{ placeholder: true }] },
  ];
  const byId = {
    aTropCourt: { suisseParcours: '16es de finale' }, // déjà dépassé → perdu
    bEncorePossible: { suisseParcours: 'Quarts de finale' }, // pas encore exclu → pas perdu
  };
  const out = annotateLost(byId, rounds, {});
  assert.equal(out.aTropCourt.lost.suisseParcours, true);
  assert.equal(out.bEncorePossible.lost.suisseParcours, undefined);
});

test('annotateLost : total déjà dépassé (buts/nuls, ne peut que croître) → grisé', () => {
  const byId = {
    a: { suisseButs: '4', matchsNuls: '10' },
    b: { suisseButs: '4' },
  };
  const out = annotateLost(byId, [], { suisseButs: 9, matchsNuls: 7 });
  assert.equal(out.a.lost.suisseButs, true); // 9 > 4
  assert.equal(out.a.lost.matchsNuls, undefined); // 7 <= 10, encore possible
  assert.equal(out.b.lost.suisseButs, true);
});

test('annotateLost : "plus de 15" jamais déclaré perdu en cours de route', () => {
  const byId = { a: { matchsNuls: 'plus de 15' } };
  const out = annotateLost(byId, [], { matchsNuls: 20 });
  assert.equal(out.a.lost.matchsNuls, undefined);
});

test('annotateLost : meilleur buteur, même logique que les autres totaux (renseigné à la main)', () => {
  const byId = {
    aTropCourt: { buteurButs: '3' }, // déjà dépassé par le leader actuel → perdu
    bEncorePossible: { buteurButs: '12' }, // encore atteignable → pas perdu
  };
  const out = annotateLost(byId, [], { buteurButs: 8 });
  assert.equal(out.aTropCourt.lost.buteurButs, true);
  assert.equal(out.bEncorePossible.lost.buteurButs, undefined);
});

test('computeActuals inclut le meilleur buteur actuel (valeur maintenue à la main)', () => {
  const actuals = computeActuals([], []);
  assert.equal(typeof actuals.buteurButs, 'number');
  assert.ok(actuals.topScorerName);
});
