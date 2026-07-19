// Diagnostic v4 : valide le fix "Stade" (v3 a confirmé que le conteneur correct est 2 niveaux
// au-dessus de la date, identifiable par la présence du texte "Stade") EN CONDITIONS RÉELLES,
// sur 3 pages représentatives : match unique déjà joué (round 29), match unique pas encore
// commencé (round 30), et un round multi-matchs pour la non-régression (round 27, quarts).
// Charge le VRAI extractInPage() depuis predictions.mjs (pas une copie qui pourrait diverger).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('./lib/predictions.mjs', import.meta.url), 'utf8');
const start = src.indexOf('function extractInPage()');
const end = src.indexOf('\n}\n', start) + 2;
const fnSrc = src.slice(start, end);

const browser = await chromium.launch();
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 MarvelousBot', timezoneId: 'Europe/Zurich', locale: 'fr-CH' });
const page = await ctx.newPage();

const urls = [
  ['round 29 (3e place, 1 match, joué)', 'https://pronostics.rts.ch/users/wmd3/round/29'],
  ['round 30 (finale, 1 match, pas commencé)', 'https://pronostics.rts.ch/users/wmd3/round/30'],
  ['round 27 (quarts, plusieurs matchs, joués)', 'https://pronostics.rts.ch/users/wmd3/round/27'],
];

for (const [label, url] of urls) {
  console.log(`\n=== ${label} : ${url} ===`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => /\d{1,2} \S+ \| \d{1,2}:\d{2}/.test(document.body.innerText), { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const result = await page.evaluate(`(${fnSrc})()`);
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.log('ERROR:', e.message);
  }
}

await browser.close();
