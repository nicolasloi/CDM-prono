// Diagnostic v2 : le fix (childElementCount<=1) n'a PAS résolu le "0 pronos" en prod malgré
// une vérification locale positive sur du HTML fabriqué à la main — donc mon hypothèse sur la
// vraie structure DOM RTS était fausse quelque part. On instrumente extractInPage() en place
// pour voir exactement où ça casse sur la vraie page (tag/classe du conteneur retenu, nombre de
// leaves collectées, chunks obtenus) au lieu de deviner.
import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 MarvelousBot', timezoneId: 'Europe/Zurich', locale: 'fr-CH' });
const page = await ctx.newPage();

const url = 'https://pronostics.rts.ch/users/wmd3/round/29'; // Finale 3e place : 1 seul match, déjà joué
console.log(`=== ${url} ===`);
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForFunction(() => /\d{1,2} \S+ \| \d{1,2}:\d{2}/.test(document.body.innerText), { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1500);

const info = await page.evaluate(() => {
  const dateRe = /^\d{1,2} \S+ \| \d{1,2}:\d{2}$/;
  const dateLeaves = [...document.querySelectorAll('span,div,h3,p')]
    .filter((e) => e.childElementCount === 0 && dateRe.test(e.textContent.trim()));
  const out = { dateLeavesCount: dateLeaves.length };
  if (!dateLeaves.length) return out;

  // Rejoue le climbing EXACT du fix actuel, en traçant chaque étape.
  let list = dateLeaves[0];
  const trail = [];
  let guard = 0;
  while (list && (list.childElementCount <= 1 || !dateLeaves.every((s) => list.contains(s))) && guard++ < 50) {
    trail.push({ tag: list.tagName, cls: list.className, childCount: list.childElementCount });
    list = list.parentElement;
  }
  out.finalTag = list ? list.tagName : null;
  out.finalClass = list ? list.className : null;
  out.finalChildCount = list ? list.childElementCount : null;
  out.climbSteps = trail.length;
  out.trail = trail.slice(0, 10);

  if (!list) { out.leavesCount = 0; return out; }
  const leaves = [];
  const walk = (n) => { for (const c of n.children) { if (c.childElementCount === 0) { const t = c.textContent.trim(); if (t) leaves.push(t); } else walk(c); } };
  walk(list);
  out.leavesCount = leaves.length;
  out.leavesSample = leaves.slice(0, 20);

  // Combien de dateLeaves ce `list` contient-il vraiment (vérif indépendante) ?
  out.containsAllDates = dateLeaves.every((s) => list.contains(s));

  // outerHTML tronqué du conteneur retenu, pour voir sa vraie forme.
  out.outerHTMLSnippet = list.outerHTML ? list.outerHTML.slice(0, 1500) : null;
  return out;
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
