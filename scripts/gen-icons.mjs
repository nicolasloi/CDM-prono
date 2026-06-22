// Génère les icônes PWA (fond nuit + « 26 » or + barre tricolore) via sharp.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const bars = (y, w) => {
  const seg = (w - 16) / 3, x0 = (512 - w) / 2;
  return `
    <rect x="${x0}" y="${y}" width="${seg}" height="14" rx="7" fill="#e3342f"/>
    <rect x="${x0 + seg + 8}" y="${y}" width="${seg}" height="14" rx="7" fill="#00a85a"/>
    <rect x="${x0 + 2 * (seg + 8)}" y="${y}" width="${seg}" height="14" rx="7" fill="#2b6fff"/>`;
};

// scale : taille du "26" (300 plein cadre, ~210 pour le maskable avec marge de sécurité)
const svg = (fontSize, baselineY, barY, barW) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0a0e1a"/>
  <text x="256" y="${baselineY}" font-family="Helvetica,Arial,sans-serif" font-size="${fontSize}" font-weight="900" font-style="italic" fill="#e8c66a" text-anchor="middle">26</text>
  ${bars(barY, barW)}
</svg>`;

const anyIcon = svg(300, 312, 360, 212);
const maskIcon = svg(210, 280, 320, 150);

mkdirSync('public', { recursive: true });
await sharp(Buffer.from(anyIcon)).resize(512, 512).png().toFile('public/icon-512.png');
await sharp(Buffer.from(anyIcon)).resize(192, 192).png().toFile('public/icon-192.png');
await sharp(Buffer.from(anyIcon)).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(maskIcon)).resize(512, 512).png().toFile('public/icon-512-maskable.png');
console.log('icônes PWA générées');
