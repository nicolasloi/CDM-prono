// Nom d'équipe (français, tel qu'affiché par RTS) → emoji drapeau.
// Codes ISO-2 convertis en indicateurs régionaux ; cas spéciaux pour les nations britanniques.

const ISO = {
  'Mexique': 'MX', 'Afrique du Sud': 'ZA', 'Corée du Sud': 'KR', 'Tchéquie': 'CZ',
  'Canada': 'CA', 'Bosnie-Herzégovine': 'BA', 'USA': 'US', 'États-Unis': 'US', 'Etats-Unis': 'US',
  'Paraguay': 'PY', 'Qatar': 'QA', 'Suisse': 'CH', 'Brésil': 'BR', 'Maroc': 'MA',
  'Haïti': 'HT', 'Australie': 'AU', 'Turquie': 'TR', 'Allemagne': 'DE', 'Curacao': 'CW', 'Curaçao': 'CW',
  'Pays-Bas': 'NL', 'Japon': 'JP', "Côte d'Ivoire": 'CI', 'Équateur': 'EC', 'Equateur': 'EC',
  'Suède': 'SE', 'Tunisie': 'TN', 'Espagne': 'ES', 'Cap Vert': 'CV', 'Belgique': 'BE',
  'Égypte': 'EG', 'Egypte': 'EG', 'Arabie saoudite': 'SA', 'Uruguay': 'UY', 'Iran': 'IR',
  'Nouvelle-Zélande': 'NZ', 'France': 'FR', 'Sénégal': 'SN', 'Irak': 'IQ', 'Norvège': 'NO',
  'Argentine': 'AR', 'Algérie': 'DZ', 'Autriche': 'AT', 'Jordanie': 'JO', 'Portugal': 'PT',
  'RD Congo': 'CD', 'Croatie': 'HR', 'Ghana': 'GH', 'Panama': 'PA', 'Ouzbékistan': 'UZ',
  'Colombie': 'CO', 'Italie': 'IT', 'Pologne': 'PL', 'Ukraine': 'UA', 'Nigeria': 'NG', 'Nigéria': 'NG',
  'Cameroun': 'CM', 'Costa Rica': 'CR', 'Honduras': 'HN', 'Jamaïque': 'JM', 'Pérou': 'PE',
  'Chili': 'CL', 'Pays de Galles': 'GB-WLS', 'Angleterre': 'GB-ENG', 'Écosse': 'GB-SCT', 'Ecosse': 'GB-SCT',
  'Danemark': 'DK', 'Serbie': 'RS', 'Ghana': 'GH', 'Venezuela': 'VE', 'Bolivie': 'BO',
};

const SPECIAL = {
  'GB-ENG': '🏴\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  'GB-SCT': '🏴\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
  'GB-WLS': '🏴\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}',
};

export function flagFor(teamName) {
  const iso = ISO[teamName?.trim()];
  if (!iso) return '';
  if (SPECIAL[iso]) return SPECIAL[iso];
  return iso.replace(/./g, (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65));
}
