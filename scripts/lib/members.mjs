// Couleurs tricolores cyclées pour les pastilles de rang.
export const ACCENTS = ['#e3342f', '#00a85a', '#2b6fff'];
export const accentFor = (i) => ACCENTS[i % ACCENTS.length];

// Palette de 7 couleurs distinctes : une couleur SIGNATURE stable par joueur
// (réutilisée pour la pastille du classement, le sparkline et le bump chart).
export const PLAYER_COLORS = ['#e8c66a', '#e3342f', '#2b6fff', '#00a85a', '#ff7a3d', '#b06bff', '#00d2c6'];

// Map clé→couleur stable (clés triées → assignation déterministe).
export function buildColorMap(keys) {
  const sorted = [...new Set(keys)].sort();
  const map = {};
  sorted.forEach((k, i) => { map[k] = PLAYER_COLORS[i % PLAYER_COLORS.length]; });
  return map;
}

// Normalise un nom pour servir de clé stable si l'id manque.
export const nameKey = (s) => s.normalize('NFKD').replace(/[^\w]/g, '').toLowerCase();
