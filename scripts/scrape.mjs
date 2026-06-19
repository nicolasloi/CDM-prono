// Orchestrateur : scrape le classement (HTML public) + les pronos par joueur (Playwright),
// produit latest/timeseries/predictions/matches, et n'écrit QUE si quelque chose a changé
// (anti-bloat : pas de commit inutile à chaque passage du cron).
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { parseCommunity } from './lib/parse.mjs';
import { buildLatest, buildTimeseries } from './lib/aggregate.mjs';
import { scrapePredictions, mergePredictions } from './lib/predictions.mjs';
import { buildMatches } from './lib/matches.mjs';
import { TOURNAMENT_OVER } from './lib/season.mjs';

const COMMUNITY_URL = 'https://pronostics.rts.ch/communities/484';
const DATA = new URL('../data/', import.meta.url);
const SNAPS = new URL('../data/snapshots/', import.meta.url);

const fileUrl = (name) => new URL(name, DATA);
const readJSON = (url) => (existsSync(url) ? JSON.parse(readFileSync(url, 'utf8')) : null);
const write = (name, obj) => writeFileSync(fileUrl(name), JSON.stringify(obj, null, 2));

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 MarvelousBot' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function readSnapshots() {
  if (!existsSync(SNAPS)) return [];
  return readdirSync(SNAPS).filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(new URL(f, SNAPS), 'utf8')));
}

// Empreinte stable du classement (ignore les timestamps/deltas).
const membersFingerprint = (members) =>
  JSON.stringify((members || []).map((m) => [m.id, m.name, m.rank, m.totalPoints, m.isAdmin]));

async function main() {
  if (TOURNAMENT_OVER()) { console.log('Tournoi terminé — scraper en pause.'); return; }
  mkdirSync(SNAPS, { recursive: true });

  const parsed = parseCommunity(await fetchHtml(COMMUNITY_URL));
  if (!parsed.members.length) {
    console.error('Aucun membre parsé — HTML probablement changé. Abandon sans écrire.');
    process.exit(1);
  }

  const fresh = await scrapePredictions(parsed.members.filter((m) => m.id));
  const freshCount = Object.values(fresh).reduce((s, p) => s + p.matches.length, 0);
  if (freshCount === 0) {
    console.error('Aucun prono récupéré — abandon sans écrire (rendu JS probablement cassé).');
    process.exit(1);
  }

  // Détection de changement (vs fichiers existants), en ignorant les horodatages.
  const prevLatest = readJSON(fileUrl('latest.json'));
  const prevPreds = readJSON(fileUrl('predictions.json'));
  // Accumule l'historique (le profil RTS ne montre qu'une fenêtre glissante).
  const byId = mergePredictions(prevPreds?.byId, fresh);
  const totalPreds = Object.values(byId).reduce((s, p) => s + p.matches.length, 0);
  const membersChanged = membersFingerprint(parsed.members) !== membersFingerprint(prevLatest?.members);
  const predsChanged = JSON.stringify(byId) !== JSON.stringify(prevPreds?.byId);

  if (!membersChanged && !predsChanged) {
    console.log('Rien de neuf — aucun fichier réécrit.');
    return;
  }

  // Snapshot d'historique : seulement quand les points changent (sinon le repo gonfle pour rien).
  const all = readSnapshots();
  const last = all.sort((a, b) => a.takenAt.localeCompare(b.takenAt)).at(-1);
  if (!last || membersFingerprint(parsed.members) !== membersFingerprint(last.members)) {
    const takenAt = new Date().toISOString();
    const fname = `${takenAt.replace(/[:.]/g, '-')}.json`;
    writeFileSync(new URL(fname, SNAPS), JSON.stringify({ takenAt, ...parsed }, null, 2));
    all.push({ takenAt, ...parsed });
  }

  write('latest.json', buildLatest(all));
  write('timeseries.json', buildTimeseries(all));
  write('predictions.json', { byId });
  write('matches.json', { matches: buildMatches(byId) });

  console.log(`MAJ : ${parsed.members.length} membres, ${totalPreds} pronos${membersChanged ? ' (points changés)' : ''}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
