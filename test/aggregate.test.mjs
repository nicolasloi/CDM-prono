import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLatest, buildTimeseries } from '../scripts/lib/aggregate.mjs';

const snaps = [
  { takenAt: '2026-06-11T20:00:00Z', members: [
    { id: 'a', name: 'A', rank: 1, totalPoints: 10, isAdmin: false },
    { id: 'b', name: 'B', rank: 2, totalPoints: 8, isAdmin: false },
  ], experts: [12,16,18] },
  { takenAt: '2026-06-12T20:00:00Z', members: [
    { id: 'b', name: 'B', rank: 1, totalPoints: 14, isAdmin: false },
    { id: 'a', name: 'A', rank: 2, totalPoints: 11, isAdmin: false },
  ], experts: [12,16,18] },
];

test('buildLatest ajoute deltas points & rang depuis le snapshot précédent', () => {
  const latest = buildLatest(snaps);
  const b = latest.members.find((m) => m.id === 'b');
  assert.equal(b.rank, 1);
  assert.equal(b.pointsDelta, 6);
  assert.equal(b.rankDelta, 1);
  const a = latest.members.find((m) => m.id === 'a');
  assert.equal(a.rankDelta, -1);
});

test('buildLatest sans précédent → deltas nuls', () => {
  const latest = buildLatest([snaps[0]]);
  assert.equal(latest.members[0].pointsDelta, 0);
  assert.equal(latest.members[0].rankDelta, 0);
});

test('buildTimeseries regroupe par membre dans le temps', () => {
  const ts = buildTimeseries(snaps);
  assert.deepEqual(ts.a.map((p) => p.totalPoints), [10, 11]);
  assert.deepEqual(ts.b.map((p) => p.rank), [2, 1]);
  assert.equal(ts.a[0].name, 'A');
});
