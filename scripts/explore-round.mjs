// Script d'exploration ponctuel : dump du texte brut d'une page RTS pour comprendre sa structure
// avant d'écrire un parseur dédié. Pas destiné à rester dans le pipeline.
import { chromium } from 'playwright';

const url = process.argv[2] || 'https://pronostics.rts.ch/users/9Nz1/round/21';

const browser = await chromium.launch();
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 MarvelousBot', timezoneId: 'Europe/Zurich', locale: 'fr-CH' });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
const text = await page.evaluate(() => document.body.innerText);
console.log('=== RAW TEXT START ===');
console.log(text);
console.log('=== RAW TEXT END ===');

// Composants React server-rendered : chaque data-react-props est un JSON structuré.
// Beaucoup plus fiable à parser que le texte brut → on les dump tous.
const propsBlobs = await page.evaluate(() =>
  [...document.querySelectorAll('[data-react-class]')].map((el) => ({
    cls: el.getAttribute('data-react-class'),
    props: el.getAttribute('data-react-props'),
  }))
);
console.log('=== REACT COMPONENTS ===');
for (const b of propsBlobs) {
  console.log('--- ' + b.cls + ' ---');
  console.log(b.props);
}

await browser.close();
