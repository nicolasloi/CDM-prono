import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCommunity } from '../scripts/lib/parse.mjs';

const html = readFileSync(new URL('./fixtures/community.html', import.meta.url), 'utf8');
const r = parseCommunity(html);

test('parse les membres avec rang, points, id', () => {
  assert.equal(r.members.length, 4);
  assert.deepEqual(r.members[0], { id: '9Nz1', name: 'Vitor Pinto', rank: 1, totalPoints: 18, isAdmin: false });
  assert.equal(r.members[2].name, 'Mehdi M');
  assert.equal(r.members[2].isAdmin, true);
  assert.equal(r.members[2].totalPoints, 11);
});

test('gère les rangs ex æquo', () => {
  assert.equal(r.members[2].rank, 3);
  assert.equal(r.members[3].rank, 3);
});

test('parse les experts', () => {
  assert.deepEqual(r.experts, [12, 16, 18]);
});
