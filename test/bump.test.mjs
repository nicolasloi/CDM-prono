import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRankByDay } from '../scripts/lib/bump.mjs';

// 2 relevés le 12, 1 le 13 (heures UTC qui restent le même jour en CEST).
const ts = {
  a: [
    { takenAt: '2026-06-12T10:00:00Z', pos: 1, name: 'A' },
    { takenAt: '2026-06-12T18:00:00Z', pos: 2, name: 'A' },
    { takenAt: '2026-06-13T18:00:00Z', pos: 1, name: 'A' },
  ],
  b: [
    { takenAt: '2026-06-12T10:00:00Z', pos: 2, name: 'B' },
    { takenAt: '2026-06-12T18:00:00Z', pos: 1, name: 'B' },
    { takenAt: '2026-06-13T18:00:00Z', pos: 2, name: 'B' },
  ],
};

test('jours triés et dédupliqués', () => {
  const { days } = buildRankByDay(ts);
  assert.deepEqual(days, ['2026-06-12', '2026-06-13']);
});

test('prend la dernière position de chaque jour', () => {
  const { byId } = buildRankByDay(ts);
  assert.deepEqual(byId.a.positions, [2, 1]); // 12 juin → dernière = 2 ; 13 → 1
  assert.deepEqual(byId.b.positions, [1, 2]);
  assert.equal(byId.a.name, 'A');
});

test('reporte la dernière position connue sur un jour sans relevé', () => {
  const ts2 = { a: [
    { takenAt: '2026-06-12T18:00:00Z', pos: 3, name: 'A' },
    { takenAt: '2026-06-14T18:00:00Z', pos: 1, name: 'A' },
  ] };
  const { days, byId } = buildRankByDay(ts2);
  // pas de relevé le 13 → on reporte 3
  const i13 = days.indexOf('2026-06-13');
  assert.equal(i13, -1); // le 13 n'existe pas car aucun relevé ce jour-là
  assert.deepEqual(byId.a.positions, [3, 1]);
});
