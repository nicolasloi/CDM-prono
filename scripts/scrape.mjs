import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { parseCommunity } from './lib/parse.mjs';
import { buildLatest, buildTimeseries } from './lib/aggregate.mjs';
import { TOURNAMENT_OVER } from './lib/season.mjs';

const COMMUNITY_URL = 'https://pronostics.rts.ch/communities/484';
const DATA = new URL('../data/', import.meta.url);
const SNAPS = new URL('../data/snapshots/', import.meta.url);

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 MarvelousBot' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function readSnapshots() {
  if (!existsSync(SNAPS)) return [];
  return readdirSync(SNAPS)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(new URL(f, SNAPS), 'utf8')));
}

async function main() {
  if (TOURNAMENT_OVER()) { console.log('Tournoi terminé — scraper en pause.'); return; }
  mkdirSync(SNAPS, { recursive: true });
  const html = await fetchHtml(COMMUNITY_URL);
  const parsed = parseCommunity(html);

  if (!parsed.members.length) {
    console.error('Aucun membre parsé — HTML probablement changé. Abandon sans écrire.');
    process.exit(1);
  }

  const takenAt = new Date().toISOString();
  const snapshot = { takenAt, ...parsed };
  const fname = `${takenAt.replace(/[:.]/g, '-')}.json`;
  writeFileSync(new URL(fname, SNAPS), JSON.stringify(snapshot, null, 2));

  const all = readSnapshots();
  writeFileSync(new URL('latest.json', DATA), JSON.stringify(buildLatest(all), null, 2));
  writeFileSync(new URL('timeseries.json', DATA), JSON.stringify(buildTimeseries(all), null, 2));

  console.log(`OK : ${parsed.members.length} membres, snapshot ${fname}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
