// Parsing des dates RTS ("11 juin | 21:00", affichées en heure suisse CEST = UTC+2).
const MONTHS = { janvier: 1, février: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, août: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12 };
const YEAR = 2026;

// Clé numérique triable (mois*1e6 + jour*1e4 + hh*100 + mm).
export function sortKey(dateStr) {
  const m = /^(\d{1,2}) (\S+) \| (\d{1,2}):(\d{2})$/.exec(dateStr || '');
  if (!m) return 0;
  return (MONTHS[m[2]] ?? 0) * 1e6 + Number(m[1]) * 1e4 + Number(m[3]) * 100 + Number(m[4]);
}

// ISO avec offset CEST, ex "2026-06-11T21:00:00+02:00".
export function toISO(dateStr) {
  const m = /^(\d{1,2}) (\S+) \| (\d{1,2}):(\d{2})$/.exec(dateStr || '');
  if (!m) return null;
  const mo = String(MONTHS[m[2]] ?? 1).padStart(2, '0');
  const d = m[1].padStart(2, '0');
  return `${YEAR}-${mo}-${d}T${m[3].padStart(2, '0')}:${m[4]}:00+02:00`;
}
