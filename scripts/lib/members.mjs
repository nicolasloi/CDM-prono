// Couleurs tricolores cyclées pour les pastilles de rang.
export const ACCENTS = ['#e3342f', '#00a85a', '#2b6fff'];
export const accentFor = (i) => ACCENTS[i % ACCENTS.length];

// Palette de 7 couleurs distinctes : une couleur SIGNATURE stable par joueur
// (réutilisée pour la pastille du classement, le sparkline et le bump chart).
export const PLAYER_COLORS = ['#e8c66a', '#e3342f', '#2b6fff', '#00a85a', '#ff7a3d', '#b06bff', '#00d2c6'];

// Couleur FIXE par id RTS, dérivée une fois pour toutes de l'ordre trié des 7 membres
// d'ORIGINE (Mica P inclus, alors en tête de tri). Si buildColorMap recalculait juste sur les
// membres actuellement affichés, exclure quelqu'un décalerait la couleur de tout le monde
// (ex. exclure Mica a fait perdre sa couleur à chaque joueur restant) — donc chaque joueur
// garde ici toujours la même couleur, peu importe qui d'autre est affiché.
const FIXED_COLORS = {
  '2xN6': '#e8c66a', // Mica P (exclu du site, gardé ici pour ne pas décaler les couleurs des autres)
  '7GjW': '#e3342f', // Mehdi M
  '8Yak': '#2b6fff', // Cayan F
  '9Nz1': '#00a85a', // Vitor Pinto
  'G3EG': '#ff7a3d', // Thomas M
  'O52a': '#b06bff', // Joao M
  'wmd3': '#00d2c6', // Nicolas L
};

// Map clé→couleur stable. Priorité à FIXED_COLORS (couleur signature figée par joueur) ;
// repli déterministe (clés triées, palette restante) pour un id encore inconnu.
export function buildColorMap(keys) {
  const sorted = [...new Set(keys)].sort();
  const used = new Set(Object.values(FIXED_COLORS));
  const map = {};
  let next = 0;
  for (const k of sorted) {
    if (FIXED_COLORS[k]) { map[k] = FIXED_COLORS[k]; continue; }
    while (used.has(PLAYER_COLORS[next % PLAYER_COLORS.length])) next++;
    map[k] = PLAYER_COLORS[next % PLAYER_COLORS.length];
    next++;
  }
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
