// Scrape les pronostics par match de chaque membre via Playwright (les pronos sont rendus en JS).
// Produit data/predictions.json : { generatedAt, byId: { <id>: { name, matches: [...] } } }.
// Les pronos ne sont publics qu'après le coup d'envoi (matchs à venir masqués) → on ne garde que les matchs joués.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { TOURNAMENT_OVER } from './lib/season.mjs';

const LATEST = new URL('../data/latest.json', import.meta.url);
const OUT = new URL('../data/predictions.json', import.meta.url);

const MONTHS = { janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5, juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11 };
function sortKey(dateStr) {
  const m = /^(\d{1,2}) (\S+) \| (\d{1,2}):(\d{2})$/.exec(dateStr || '');
  if (!m) return 0;
  return (MONTHS[m[2]] ?? 0) * 1e6 + Number(m[1]) * 1e4 + Number(m[3]) * 100 + Number(m[4]);
}

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

async function main() {
  if (TOURNAMENT_OVER()) { console.log('Tournoi terminé — scraper en pause.'); return; }

  const latest = JSON.parse(readFileSync(LATEST, 'utf8'));
  const members = latest.members.filter((m) => m.id);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 MarvelousBot' });
  const byId = {};

  for (const mem of members) {
    const page = await ctx.newPage();
    try {
      await page.goto(`https://pronostics.rts.ch/users/${mem.id}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => /\d{1,2} \S+ \| \d{1,2}:\d{2}/.test(document.body.innerText), { timeout: 15000 }).catch(() => {});
      const matches = (await page.evaluate(extractInPage))
        .filter((x) => x.played && x.predHome !== null && x.predAway !== null)
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

  const total = Object.values(byId).reduce((s, p) => s + p.matches.length, 0);
  if (total === 0) {
    console.error('Aucun prono récupéré — abandon sans écrire (rendu JS probablement cassé).');
    process.exit(1);
  }
  writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), byId }, null, 2));
  console.log(`Pronos : ${members.length} joueurs, ${total} pronos révélés.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
