// Garde-fou : le scraper s'arrête 2 jours après la finale de la CDM 2026.
// Finale = 19 juillet 2026 → on tourne jusqu'au 21 juillet inclus (heure suisse).
export const TOURNAMENT_END = '2026-07-21T23:59:59+02:00';

export function TOURNAMENT_OVER(now = new Date()) {
  return now.getTime() > new Date(TOURNAMENT_END).getTime();
}
