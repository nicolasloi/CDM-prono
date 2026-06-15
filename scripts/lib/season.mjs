// Garde-fou : le scraper s'arrête après la fin de la Coupe du Monde 2026.
// Finale = 19 juillet 2026 ; on laisse une marge jusqu'au 20 inclus.
export const TOURNAMENT_END = '2026-07-20T23:59:59Z';

export function TOURNAMENT_OVER(now = new Date()) {
  return now.getTime() > new Date(TOURNAMENT_END).getTime();
}
