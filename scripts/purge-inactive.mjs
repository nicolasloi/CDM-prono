// Script ponctuel : purge un membre inactif (ex. Mica P) de TOUTES les données déjà stockées
// (snapshots, latest, timeseries, predictions, matches) — pas seulement des futurs scrapes.
// À lancer une fois, à la main : `node scripts/purge-inactive.mjs`.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { buildLatest, buildTimeseries } from './lib/aggregate.mjs';
import { buildMatches } from './lib/matches.mjs';
import { excludeInactiveMembers, isExcludedMember } from './lib/members.mjs';

const DATA = new URL('../data/', import.meta.url);
const SNAPS = new URL('../data/snapshots/', import.meta.url);
const fileUrl = (name) => new URL(name, DATA);
const readJSON = (url) => JSON.parse(readFileSync(url, 'utf8'));
const write = (name, obj) => writeFileSync(fileUrl(name), JSON.stringify(obj, null, 2) + '\n');

// 1) Snapshots : purge + réindexe le rang dans chaque fichier d'historique.
const snapFiles = readdirSync(SNAPS).filter((f) => f.endsWith('.json'));
let touched = 0;
for (const f of snapFiles) {
  const url = new URL(f, SNAPS);
  const snap = readJSON(url);
  if (!snap.members?.some(isExcludedMember)) continue;
  snap.members = excludeInactiveMembers(snap.members);
  writeFileSync(url, JSON.stringify(snap, null, 2) + '\n');
  touched++;
}
console.log(`Snapshots purgés : ${touched}/${snapFiles.length}`);

// 2) Reconstruit latest.json / timeseries.json à partir des snapshots déjà purgés.
const allSnaps = snapFiles.map((f) => readJSON(new URL(f, SNAPS)));
write('latest.json', buildLatest(allSnaps));
write('timeseries.json', buildTimeseries(allSnaps));

// 3) predictions.json : retire l'entrée byId du membre exclu.
const preds = readJSON(fileUrl('predictions.json'));
for (const id of Object.keys(preds.byId)) {
  if (isExcludedMember({ id, name: preds.byId[id].name })) delete preds.byId[id];
}
write('predictions.json', preds);

// 4) matches.json : reconstruit à partir des predictions déjà purgées (retire ses pronos partout).
write('matches.json', { matches: buildMatches(preds.byId) });

console.log('Purge terminée : latest.json, timeseries.json, predictions.json, matches.json régénérés.');
