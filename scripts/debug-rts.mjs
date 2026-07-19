// Diagnostic v3 : v2 a montré que le conteneur ".scoreBet__header" (date + "Points totaux")
// n'est qu'un EN-TÊTE, frère du reste de la carte (stade/équipes/pronostic/résultat) — pas un
// ancêtre qui les contient. On grimpe sans condition sur plusieurs niveaux au-dessus du header
// pour repérer exactement où apparaît le contenu complet (présence du mot « Stade » ou « Résultat »).
import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 MarvelousBot', timezoneId: 'Europe/Zurich', locale: 'fr-CH' });
const page = await ctx.newPage();

const url = 'https://pronostics.rts.ch/users/wmd3/round/29';
console.log(`=== ${url} ===`);
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForFunction(() => /\d{1,2} \S+ \| \d{1,2}:\d{2}/.test(document.body.innerText), { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1500);

const info = await page.evaluate(() => {
  const dateRe = /^\d{1,2} \S+ \| \d{1,2}:\d{2}$/;
  const dateLeaves = [...document.querySelectorAll('span,div,h3,p')]
    .filter((e) => e.childElementCount === 0 && dateRe.test(e.textContent.trim()));
  if (!dateLeaves.length) return { dateLeavesCount: 0 };

  let node = dateLeaves[0];
  const levels = [];
  for (let i = 0; i < 8 && node; i++) {
    const text = node.textContent || '';
    levels.push({
      depth: i,
      tag: node.tagName,
      cls: node.className || null,
      childElementCount: node.childElementCount,
      textLen: text.length,
      hasStade: /Stade/.test(text),
      hasResultat: /Résultat/.test(text),
      hasEquipe: /France|Angleterre/.test(text),
      textPreview: text.replace(/\s+/g, ' ').trim().slice(0, 200),
    });
    node = node.parentElement;
  }
  return { dateLeavesCount: dateLeaves.length, levels };
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
