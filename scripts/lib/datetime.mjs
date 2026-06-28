// Parsing des dates RTS ("11 juin | 21:00", affichées en heure suisse CEST = UTC+2).
// RTS abrège certains mois (ex. "juil." pour juillet) → on gère les deux formes.
const MONTHS = {
  janvier: 1, 'janv.': 1, février: 2, 'févr.': 2, mars: 3, avril: 4, 'avr.': 4, mai: 5,
  juin: 6, juillet: 7, 'juil.': 7, août: 8, septembre: 9, 'sept.': 9, octobre: 10, 'oct.': 10,
  novembre: 11, 'nov.': 11, décembre: 12, 'déc.': 12,
};
const MO_SHORT = { 6: 'juin', 7: 'juil.' };
const YEAR = 2026;

// Clé numérique triable (mois*1e6 + jour*1e4 + hh*100 + mm).
export function sortKey(dateStr) {
  const m = /^(\d{1,2}) (\S+) \| (\d{1,2}):(\d{2})$/.exec(dateStr || '');
  if (!m) return 0;
  return (MONTHS[m[2]] ?? 0) * 1e6 + Number(m[1]) * 1e4 + Number(m[3]) * 100 + Number(m[4]);
}

// ISO avec offset CEST, ex "2026-06-11T21:00:00+02:00". null si le mois est inconnu
// (on ne fabrique pas une fausse date — mieux vaut "à venir" qu'un janvier erroné).
export function toISO(dateStr) {
  const m = /^(\d{1,2}) (\S+) \| (\d{1,2}):(\d{2})$/.exec(dateStr || '');
  if (!m || !MONTHS[m[2]]) return null;
  const mo = String(MONTHS[m[2]]).padStart(2, '0');
  const d = m[1].padStart(2, '0');
  return `${YEAR}-${mo}-${d}T${m[3].padStart(2, '0')}:${m[4]}:00+02:00`;
}

// Libellé court "28 juin · 21:00" pour une affiche à venir, à partir de la date brute
// ("28 juin | 21:00") ou du kickoff ISO. null si la date n'est pas exploitable.
export function whenLabel(f = {}) {
  if (f.date && /^\d{1,2} \S+ \| \d{1,2}:\d{2}$/.test(f.date)) return f.date.replace(' | ', ' · ');
  const m = /^2026-(0[67])-(\d{2})T(\d{2}):(\d{2})/.exec(f.kickoff || '');
  if (!m) return null;
  return `${Number(m[2])} ${MO_SHORT[Number(m[1])]} · ${m[3]}:${m[4]}`;
}

// « Journée de match » à partir d'un instant ISO : on coupe les journées à MIDI (heure suisse),
// en pleine période calme (aucun match ~08h–18h CEST). Comme la CDM est aux USA/Canada/Mexique,
// une soirée/nuit de matchs (≈18h→08h CEST) chevauche minuit ; ce découpage la garde en UNE seule
// journée, étiquetée par le jour du soir. Renvoie "YYYY-MM-DD".
export const matchDay = (iso) =>
  new Date(new Date(iso).getTime() - 12 * 3600 * 1000).toLocaleDateString('fr-CA', { timeZone: 'Europe/Zurich' });
