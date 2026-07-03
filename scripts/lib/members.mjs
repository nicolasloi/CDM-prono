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

// Nom d'affichage : retire l'initiale du nom de famille en fin de nom ("Nicolas L" → "Nicolas").
// Un vrai nom de famille écrit en entier ("Vitor Pinto") est conservé.
export const shortName = (name) => String(name || '').replace(/\s+\p{L}\.?$/u, '').trim() || String(name || '');

// Normalise un nom pour servir de clé stable si l'id manque.
export const nameKey = (s) => s.normalize('NFKD').replace(/[^\w]/g, '').toLowerCase();

// Membres inactifs (ne jouent pas) → exclus de tout le site : classement, courbes, tableau,
// matchs, historique. Identifié par id RTS (stable) avec repli sur le nom normalisé.
export const EXCLUDED_IDS = new Set(['2xN6']); // Mica P
const EXCLUDED_NAMES = new Set(['micap']); // nameKey('Mica P')
export const isExcludedMember = (m) => EXCLUDED_IDS.has(m?.id) || EXCLUDED_NAMES.has(nameKey(m?.name || ''));

// Filtre une liste de membres et réindexe le rang (1..N) sur ce qui reste.
export function excludeInactiveMembers(members = []) {
  return members.filter((m) => !isExcludedMember(m)).map((m, i) => ({ ...m, rank: i + 1 }));
}
