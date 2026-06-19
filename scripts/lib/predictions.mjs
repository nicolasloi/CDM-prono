// Scrape les pronostics par match de chaque membre via Playwright (rendus en JS, publics après coup d'envoi).
import { chromium } from 'playwright';
import { sortKey } from './datetime.mjs';

// Exécuté DANS la page : renvoie un tableau de matchs structurés.
function extractInPage() {
  const dateRe = /^\d{1,2} \S+ \| \d{1,2}:\d{2}$/;
  const dateLeaves = [...document.querySelectorAll('span,div,h3,p')]
    .filter((e) => e.childElementCount === 0 && dateRe.test(e.textContent.trim()));
  if (!dateLeaves.length) return [];
  let list = dateLeaves[0];
  while (list && !dateLeaves.every((s) => list.contains(s))) list = list.parentElement;
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

// Fusionne l'historique stocké avec le scrape courant (le profil RTS ne montre qu'une fenêtre glissante).
// Les matchs frais écrasent les anciens (mise à jour des scores/points en direct), les anciens hors-fenêtre sont conservés.
export function mergePredictions(prevById = {}, freshById = {}) {
  const out = {};
  const ids = new Set([...Object.keys(prevById), ...Object.keys(freshById)]);
  for (const id of ids) {
    const map = new Map();
    for (const m of prevById[id]?.matches || []) map.set(matchKey(m), m);
    for (const m of freshById[id]?.matches || []) map.set(matchKey(m), m);
    const matches = [...map.values()].sort((a, b) => sortKey(b.date) - sortKey(a.date));
    out[id] = { name: freshById[id]?.name || prevById[id]?.name, matches };
  }
  return out;
}

// members: [{ id, name }] → { byId: { <id>: { name, matches:[...] } } } (matchs joués, plus récent d'abord)
export async function scrapePredictions(members) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 MarvelousBot', timezoneId: 'Europe/Zurich', locale: 'fr-CH' });
  const byId = {};
  for (const mem of members) {
    const page = await ctx.newPage();
    try {
      await page.goto(`https://pronostics.rts.ch/users/${mem.id}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => /\d{1,2} \S+ \| \d{1,2}:\d{2}/.test(document.body.innerText), { timeout: 15000 }).catch(() => {});
      // On garde un match dès que les pronos sont visibles (RTS ne les révèle qu'au coup d'envoi)
      // — donc un match « en cours » apparaît tout de suite, sans attendre le score final.
      const matches = (await page.evaluate(extractInPage))
        .filter((x) => x.predHome !== null && x.predAway !== null)
        .sort((a, b) => sortKey(b.date) - sortKey(a.date));
      byId[mem.id] = { name: mem.name, matches };
      console.log(`  ${mem.name} : ${matches.length} pronos`);
    } catch (e) {
      console.error(`  ${mem.name} (${mem.id}) échec : ${e.message}`);
      byId[mem.id] = { name: mem.name, matches: [] };
    }
    await page.close();
  }
  await browser.close();
  return byId;
}
