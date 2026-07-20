// Scrape les pronostics par match de chaque membre via Playwright (rendus en JS, publics après coup d'envoi).
import { chromium } from 'playwright';
import { sortKey } from './datetime.mjs';

// Exécuté DANS la page : renvoie un tableau de matchs structurés.
function extractInPage() {
  const dateRe = /^\d{1,2} \S+ \| \d{1,2}:\d{2}$/;
  const dateLeaves = [...document.querySelectorAll('span,div,h3,p')]
    .filter((e) => e.childElementCount === 0 && dateRe.test(e.textContent.trim()));
  if (!dateLeaves.length) return [];
  // Remonte jusqu'au conteneur commun à TOUTES les dates (plusieurs matchs sur la page) ET qui
  // contient le reste de la carte (stade/équipes/pronostic/résultat). Piège vérifié en pratique
  // sur RTS : la date vit dans un petit en-tête (".scoreBet__header", date + "Points totaux"),
  // FRÈRE du corps de la carte (".scoreBet", qui a le stade/les équipes) — pas un ancêtre de
  // celui-ci. Avec plusieurs matchs sur la page, l'ancien critère (grimper jusqu'à contenir
  // TOUTES les dates) suffisait car il fallait de toute façon remonter au-delà d'une seule carte
  // pour atteindre les autres. Mais avec UN SEUL match sur la page (Finale 3e place, Finale — un
  // seul match par tour), ce critère était déjà satisfait par l'en-tête lui-même (une seule date
  // à contenir), qui s'arrêtait donc AVANT le corps de la carte : 0 pronos extraits sans la
  // moindre erreur. Le mot « Stade » est un ancrage fiable (toujours affiché, match joué ou pas)
  // pour vérifier qu'on a bien atteint un conteneur qui inclut le corps de la carte.
  let list = dateLeaves[0];
  while (list && (!dateLeaves.every((s) => list.contains(s)) || !/Stade/.test(list.textContent))) list = list.parentElement;
  const leaves = [];
  const walk = (n) => { for (const c of n.children) { if (c.childElementCount === 0) { const t = c.textContent.trim(); if (t) leaves.push(t); } else walk(c); } };
  walk(list);
  const chunks = []; let cur = null;
  for (const t of leaves) { if (dateRe.test(t)) { cur = [t]; chunks.push(cur); } else if (cur) cur.push(t); }
  const num = (s) => (/^\d+$/.test(s) ? Number(s) : null);
  return chunks.map((c) => {
    const ptsLeaf = c.find((t) => /Points totaux/.test(t));
    const resLeaf = c.find((t) => /^\d+\s*:\s*\d+$/.test(t));
    const res = resLeaf ? resLeaf.split(/\s*:\s*/).map(Number) : null;
    return {
      date: c[0], stadium: c[2],
      home: c[3], predHome: num(c[4]), away: c[5], predAway: num(c[6]),
      actualHome: res ? res[0] : null, actualAway: res ? res[1] : null,
      points: ptsLeaf ? Number(ptsLeaf.match(/(\d+)/)[1]) : null,
      played: !!res,
    };
  });
}

// Clé indépendante du fuseau horaire (le profil RTS affiche l'heure dans le fuseau du navigateur).
const matchKey = (m) => `${m.home}|${m.away}`;

// La page de profil par défaut (/users/<id>, sans /round/N) affiche le tour que RTS considère
// "actuel" — mais dès qu'un tour se termine, RTS bascule cet affichage par défaut sur le tour
// SUIVANT (souvent encore vide, aucun match joué). Sans repli, les derniers matchs du tour qui
// vient de finir (ex. le dernier 16e de finale) ne sont alors plus jamais récupérés : la page par
// défaut ne les montre plus, et on ne les redemande jamais explicitement. Fenêtres officielles
// (mêmes dates que le sélecteur de tour du site) → on revérifie systématiquement ces tours-là en
// plus de la page par défaut, ce qui couvre aussi TOUTES les bascules futures (8es→quarts, etc.),
// pas seulement celle d'aujourd'hui.
const ROUND_WINDOWS = [
  { round: 22, start: '2026-06-11', end: '2026-06-18' }, // 1ère journée
  { round: 23, start: '2026-06-18', end: '2026-06-24' }, // 2e journée
  { round: 24, start: '2026-06-24', end: '2026-06-28' }, // 3e journée
  { round: 25, start: '2026-06-28', end: '2026-07-04' }, // 16es de finale
  { round: 26, start: '2026-07-04', end: '2026-07-07' }, // 8es de finale
  { round: 27, start: '2026-07-09', end: '2026-07-12' }, // Quarts de finale
  { round: 28, start: '2026-07-14', end: '2026-07-15' }, // Demi-finales
  { round: 29, start: '2026-07-18', end: '2026-07-18' }, // Finale 3e place
  { round: 30, start: '2026-07-19', end: '2026-07-19' }, // Finale
];

// Tours dont la fenêtre officielle touche `now` à ±1 jour près (couvre la bascule de tour ET
// d'éventuels résultats qui arrivent après la fin officielle de la fenêtre).
export function roundsToRecheck(now = new Date()) {
  const DAY = 86400000;
  const t = now.getTime();
  const windowed = ROUND_WINDOWS.filter((w) => {
    const s = Date.parse(`${w.start}T00:00:00Z`) - DAY;
    const e = Date.parse(`${w.end}T23:59:59Z`) + DAY;
    return t >= s && t <= e;
  }).map((w) => w.round);
  // Demies/3e place/finale : toujours revérifiées, même hors fenêtre — la page par défaut de RTS
  // ne montre que le tour qu'elle juge "actuel" (la finale, une fois le tournoi fini), donc un
  // tour dont la fenêtre est passée devient sinon irrécupérable si son scrape avait raté pendant
  // sa fenêtre (ex. le bug d'extraction corrigé le 19 juillet, qui a fait manquer les demies et
  // la 3e place). Coût négligeable : 3 pages en plus, seulement pour la fin du tournoi.
  const ALWAYS_RECHECK = [28, 29, 30];
  return [...new Set([...windowed, ...ALWAYS_RECHECK])].sort((a, b) => a - b);
}

// Fusionne l'historique stocké avec le scrape courant (le profil RTS ne montre qu'une fenêtre glissante).
// Les matchs frais écrasent les anciens (mise à jour des scores/points en direct), les anciens hors-fenêtre sont conservés.
export function mergePredictions(prevById = {}, freshById = {}) {
  const out = {};
  const ids = new Set([...Object.keys(prevById), ...Object.keys(freshById)]);
  for (const id of ids) {
    const map = new Map();
    for (const m of prevById[id]?.matches || []) map.set(matchKey(m), m);
    for (const m of freshById[id]?.matches || []) {
      const prev = map.get(matchKey(m));
      // Ne jamais régresser un résultat déjà connu vers un « live » sans score.
      if (prev && prev.actualHome != null && m.actualHome == null) continue;
      map.set(matchKey(m), m);
    }
    const matches = [...map.values()].sort((a, b) => sortKey(b.date) - sortKey(a.date));
    out[id] = { name: freshById[id]?.name || prevById[id]?.name, matches };
  }
  return out;
}

async function scrapeOnePage(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => /\d{1,2} \S+ \| \d{1,2}:\d{2}/.test(document.body.innerText), { timeout: 15000 }).catch(() => {});
  return page.evaluate(extractInPage);
}

// members: [{ id, name }] → { byId: { <id>: { name, matches:[...] } } } (matchs joués, plus récent d'abord)
export async function scrapePredictions(members) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 MarvelousBot', timezoneId: 'Europe/Zurich', locale: 'fr-CH' });
  const byId = {};
  const fixMap = new Map(); // matchs à venir (pronos encore masqués) = calendrier
  const recheck = roundsToRecheck();
  for (const mem of members) {
    const page = await ctx.newPage();
    try {
      // Page par défaut (tour "actuel" selon RTS) + tours de la fenêtre courante explicitement
      // redemandés (cf. commentaire sur ROUND_WINDOWS) : dédoublonné par date+équipes.
      const rawByKey = new Map();
      const addAll = (raw) => { for (const x of raw) rawByKey.set(`${x.date}|${x.home}|${x.away}`, x); };
      addAll(await scrapeOnePage(page, `https://pronostics.rts.ch/users/${mem.id}`));
      for (const r of recheck) {
        addAll(await scrapeOnePage(page, `https://pronostics.rts.ch/users/${mem.id}/round/${r}`));
      }
      const raw = [...rawByKey.values()];
      // On garde un match dès que les pronos sont visibles (RTS ne les révèle qu'au coup d'envoi)
      // — donc un match « en cours » apparaît tout de suite, sans attendre le score final.
      const matches = raw
        .filter((x) => x.predHome !== null && x.predAway !== null)
        .sort((a, b) => sortKey(b.date) - sortKey(a.date));
      byId[mem.id] = { name: mem.name, matches };
      // Matchs à venir : coup d'envoi pas encore passé. Commun à tous → on déduplique.
      // Un match « pas de résultat » (!x.played) ne veut PAS dire « pas commencé » : une fois le
      // coup d'envoi donné, RTS révèle aussitôt le prono (predHome/predAway) bien avant le score
      // final — sans le test sur predHome, un match EN COURS réapparaissait à tort dans « à venir »
      // en plus de sa carte « en cours » (doublon visible sur la page Matchs). On exige donc aussi
      // qu'AUCUN prono ne soit encore révélé pour ce match (le sien inclus).
      // NB : on ne se fie qu'au prono DE CE membre ici ; un membre qui n'a simplement pas pronostiqué
      // un match déjà en cours/joué ne doit pas le faire réapparaître comme « à venir » — d'où le
      // test combiné avec !x.played (déjà joué → jamais « à venir », quel que soit predHome).
      for (const x of raw) {
        if (!x.played && x.predHome == null && x.predAway == null && x.home && x.away) {
          const k = `${x.home}|${x.away}`;
          if (!fixMap.has(k)) fixMap.set(k, { home: x.home, away: x.away, stadium: x.stadium, date: x.date });
        }
      }
      console.log(`  ${mem.name} : ${matches.length} pronos`);
    } catch (e) {
      console.error(`  ${mem.name} (${mem.id}) échec : ${e.message}`);
      byId[mem.id] = { name: mem.name, matches: [] };
    }
    await page.close();
  }
  await browser.close();
  return { byId, fixtures: [...fixMap.values()] };
}
