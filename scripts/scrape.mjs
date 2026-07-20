// Orchestrateur : scrape le classement (HTML public) + les pronos par joueur (Playwright),
// produit latest/timeseries/predictions/matches, et n'écrit QUE si quelque chose a changé
// (anti-bloat : pas de commit inutile à chaque passage du cron).
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { parseCommunity } from './lib/parse.mjs';
import { buildLatest, buildTimeseries } from './lib/aggregate.mjs';
import { scrapePredictions, mergePredictions } from './lib/predictions.mjs';
import { excludeInactiveMembers } from './lib/members.mjs';
import { buildMatches } from './lib/matches.mjs';
import { flagFor } from './lib/flags.mjs';
import { toISO } from './lib/datetime.mjs';
import { TOURNAMENT_OVER } from './lib/season.mjs';
import { scrapePretournamentFor, computeActuals, annotateLost } from './lib/pretournament.mjs';
import { buildBracket } from './lib/bracket.mjs';

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
  // Membres inactifs (ne jouent pas) exclus dès la source : jamais scrapés, jamais stockés.
  parsed.members = excludeInactiveMembers(parsed.members);

  const prevLatest = readJSON(fileUrl('latest.json'));
  const prevPreds = readJSON(fileUrl('predictions.json'));

  // Le classement (points/rang) est la donnée FIABLE, toujours présente dans le HTML public :
  // il doit se mettre à jour quoi qu'il arrive.
  const membersChanged = membersFingerprint(parsed.members) !== membersFingerprint(prevLatest?.members);

  // Les pronos (Playwright, rendus JS) sont un BONUS best-effort : un échec ne doit JAMAIS
  // bloquer la mise à jour du classement (cf. principe « le site ne dépend jamais du bonus »).
  let scraped = { byId: {}, fixtures: [] };
  try {
    scraped = await scrapePredictions(parsed.members.filter((m) => m.id));
  } catch (e) {
    console.error(`Scrape des pronos échoué (bonus ignoré) : ${e.message}`);
  }
  const fresh = scraped.byId || {};
  const freshCount = Object.values(fresh).reduce((s, p) => s + p.matches.length, 0);
  if (freshCount === 0) console.error('Aucun prono frais — on conserve l\'historique existant.');
  // Accumule l'historique (le profil RTS ne montre qu'une fenêtre glissante) ; sans frais, on garde l'existant.
  const byId = freshCount ? mergePredictions(prevPreds?.byId, fresh) : (prevPreds?.byId || {});
  const totalPreds = Object.values(byId).reduce((s, p) => s + p.matches.length, 0);
  const predsChanged = JSON.stringify(byId) !== JSON.stringify(prevPreds?.byId);

  // Calendrier des matchs à venir (pour le bandeau « prochain match »). Si le scrape échoue, on garde l'existant.
  const prevFix = readJSON(fileUrl('fixtures.json'));
  const upcoming = (scraped.fixtures && scraped.fixtures.length)
    ? scraped.fixtures
        .map((f) => ({ home: f.home, away: f.away, homeFlag: flagFor(f.home), awayFlag: flagFor(f.away), stadium: f.stadium, date: f.date, kickoff: toISO(f.date) }))
        .sort((a, b) => String(a.kickoff).localeCompare(String(b.kickoff)))
    : (prevFix?.upcoming || []);
  const fixChanged = JSON.stringify(upcoming) !== JSON.stringify(prevFix?.upcoming);

  // Pronostics d'avant-tournoi ("Questions supplémentaires") : figés une fois pour toutes après
  // la date-limite (11 juin), donc on ne scrape QUE les membres qu'on n'a pas encore (jamais de
  // re-scrape inutile à chaque passage du cron). Best-effort, comme les pronos par match.
  const prevPret = readJSON(fileUrl('pretournament.json'));
  const missingPret = parsed.members.filter((m) => m.id && !prevPret?.byId?.[m.id]);
  let pretById = { ...(prevPret?.byId || {}) };
  let pretQuestions = prevPret?.questions || [];
  if (missingPret.length) {
    try {
      const res = await scrapePretournamentFor(missingPret);
      pretById = { ...pretById, ...res.byId };
      pretQuestions = res.questions.length ? res.questions : pretQuestions;
    } catch (e) {
      console.error(`Scrape pronos avant-tournoi échoué (bonus ignoré) : ${e.message}`);
    }
  }
  const pretChanged = JSON.stringify(pretById) !== JSON.stringify(prevPret?.byId || {});

  // Calculé même si rien d'autre n'a changé : des champs de `computeActuals` sont maintenus À LA
  // MAIN (ex. meilleur buteur, cf. pretournament.mjs) et peuvent changer sans qu'aucun match ni
  // prono ne bouge — sans cette comparaison, une mise à jour manuelle ne serait jamais écrite
  // tant qu'un vrai résultat de match ne déclenche pas une réécriture par ailleurs.
  const matchesForActuals = buildMatches(byId);
  const roundsForActuals = buildBracket(matchesForActuals, upcoming);
  const actualsPreview = computeActuals(matchesForActuals, roundsForActuals);
  const actualsChanged = JSON.stringify(actualsPreview) !== JSON.stringify(prevPret?.actuals || null);

  if (!membersChanged && !predsChanged && !fixChanged && !pretChanged && !actualsChanged) {
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

  const matches = matchesForActuals;
  const rounds = roundsForActuals;
  const actuals = actualsPreview;

  write('latest.json', buildLatest(all));
  write('timeseries.json', buildTimeseries(all));
  write('predictions.json', { byId });
  write('matches.json', { matches });
  write('fixtures.json', { upcoming });
  write('pretournament.json', { questions: pretQuestions, byId: annotateLost(pretById, rounds, actuals), actuals });

  console.log(`MAJ : ${parsed.members.length} membres, ${totalPreds} pronos${membersChanged ? ' (points changés)' : ''}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
