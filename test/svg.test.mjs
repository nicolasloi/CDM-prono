import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linePath, scaleY } from '../scripts/lib/svg.mjs';

test('scaleY mappe min→bas et max→haut (y inversé)', () => {
  assert.equal(scaleY(0, 0, 10, 100), 100);
  assert.equal(scaleY(10, 0, 10, 100), 0);
  assert.equal(scaleY(5, 0, 10, 100), 50);
});

test('scaleY évite la division par zéro (série plate)', () => {
  assert.equal(scaleY(5, 5, 5, 100), 50);
});

test('linePath génère un path à partir des valeurs', () => {
  const d = linePath([0, 5, 10], { width: 100, height: 100, min: 0, max: 10 });
  assert.match(d, /^M0,100 L50,50 L100,0$/);
});
