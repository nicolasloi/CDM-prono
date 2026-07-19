// Diagnostic temporaire : le scraper renvoie « 0 pronos » pour tout le monde depuis le 16
// juillet sans lever d'exception. On inspecte ce que RTS renvoie vraiment sur le runner CI
// (seul environnement qui a accès au site) pour comprendre où extractInPage() décroche.
import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 MarvelousBot', timezoneId: 'Europe/Zurich', locale: 'fr-CH' });
const page = await ctx.newPage();

const urls = [
  'https://pronostics.rts.ch/users/wmd3',
  'https://pronostics.rts.ch/users/wmd3/round/30',
  'https://pronostics.rts.ch/users/wmd3/round/29',
];

for (const url of urls) {
  console.log(`\n=== ${url} ===`);
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('HTTP status:', res.status());
    const found = await page.waitForFunction(() => /\d{1,2} \S+ \| \d{1,2}:\d{2}/.test(document.body.innerText), { timeout: 15000 }).then(() => true).catch(() => false);
    console.log('date pattern found within 15s:', found);
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => {
      const dateRe = /^\d{1,2} \S+ \| \d{1,2}:\d{2}$/;
      const dateLeaves = [...document.querySelectorAll('span,div,h3,p')]
        .filter((e) => e.childElementCount === 0 && dateRe.test(e.textContent.trim()));
      return {
        title: document.title,
        bodyLen: document.body.innerText.length,
        dateLeavesCount: dateLeaves.length,
        bodySnippet: document.body.innerText.slice(0, 1000),
      };
    });
    console.log('title:', info.title);
    console.log('bodyLen:', info.bodyLen, '| dateLeaves:', info.dateLeavesCount);
    console.log('--- body snippet ---');
    console.log(info.bodySnippet);
  } catch (e) {
    console.log('ERROR:', e.message);
  }
}

await browser.close();
