// Couleurs tricolores cyclées pour les pastilles de rang.
export const ACCENTS = ['#e3342f', '#00a85a', '#2b6fff'];
export const accentFor = (i) => ACCENTS[i % ACCENTS.length];

// Normalise un nom pour servir de clé stable si l'id manque.
export const nameKey = (s) => s.normalize('NFKD').replace(/[^\w]/g, '').toLowerCase();
