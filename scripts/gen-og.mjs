import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0e1a"/>
  <text x="1050" y="300" font-family="Helvetica,Arial,sans-serif" font-size="420" font-weight="900" font-style="italic" fill="none" stroke="#e8c66a" stroke-opacity="0.16" stroke-width="6" text-anchor="end">26</text>
  <path d="M-20 430 C300 360 600 470 1240 380" stroke="#e3342f" stroke-width="14" fill="none" stroke-linecap="round"/>
  <path d="M-20 470 C320 410 560 500 1240 420" stroke="#00a85a" stroke-width="14" fill="none" stroke-linecap="round"/>
  <path d="M-20 505 C280 460 620 540 1240 455" stroke="#2b6fff" stroke-width="14" fill="none" stroke-linecap="round"/>
  <text x="90" y="250" font-family="Helvetica,Arial,sans-serif" font-size="26" font-weight="800" letter-spacing="8" fill="#e8c66a">★ MARVELOUS DIGITAL</text>
  <text x="86" y="345" font-family="Helvetica,Arial,sans-serif" font-size="110" font-weight="900" fill="#eef1f8">CDM <tspan fill="#e8c66a">Prono</tspan></text>
  <text x="90" y="400" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="600" fill="#8b93ab">Classement Coupe du Monde 2026 · le groupe Marvelous</text>
</svg>`;

mkdirSync('public', { recursive: true });
await sharp(Buffer.from(svg)).png().toFile('public/og.png');
console.log('og.png généré');
