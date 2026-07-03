// Pronostics d'AVANT tournoi ("Questions supplémentaires", round RTS fixe = 21, identique pour
// tout le monde : mêmes 5 questions, seule la réponse choisie change par membre). Cette page RTS
// utilise des composants React server-rendus : chaque bloc data-react-props="TextSelection" est
// du JSON structuré (bien plus fiable que le texte brut) → { question, picks:[answerId], answers:[{id,name}] }.
// Ces réponses ne changent plus jamais après la date-limite (11 juin) : on ne les scrape qu'une
// fois par membre (cf. scrape.mjs, qui saute les membres déjà présents dans pretournament.json).
// import('playwright') est chargé À LA DEMANDE (pas en haut de fichier) : ce module est aussi
// importé par les tests unitaires de computeActuals(), qui ne touchent jamais au navigateur —
// et charger 'playwright' au niveau module suffit à bloquer indéfiniment hors environnement CI.

const PRETOURNAMENT_ROUND = 21;

// bet_id RTS → clé stable côté site (les bet_id sont fixes pour ce tournoi).
const KEY_BY_BET_ID = {
  243: 'champion',
  244: 'suisseParcours',
  245: 'suisseButs',
  246: 'buteurButs',
  247: 'matchsNuls',
};

// members: [{ id, name }] → { questions: [{id,key,question}], byId: { <id>: { [key]: label } } }
export async function scrapePretournamentFor(members) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 MarvelousBot', timezoneId: 'Europe/Zurich', locale: 'fr-CH' });
  const byId = {};
  const questions = new Map();
  for (const mem of members) {
    const page = await ctx.newPage();
    try {
      await page.goto(`https://pronostics.rts.ch/users/${mem.id}/round/${PRETOURNAMENT_ROUND}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('[data-react-class="TextSelection"]', { timeout: 15000 }).catch(() => {});
      const bets = await page.evaluate(() =>
        [...document.querySelectorAll('[data-react-class="TextSelection"]')]
          .map((el) => { try { return JSON.parse(el.getAttribute('data-react-props')).bet; } catch { return null; } })
          .filter(Boolean)
      );
      const answers = {};
      for (const bet of bets) {
        const key = KEY_BY_BET_ID[bet.bet_id] || `q${bet.bet_id}`;
        if (!questions.has(key)) questions.set(key, { id: String(bet.bet_id), key, question: bet.question.trim() });
        const pickId = bet.picks?.[0];
        const label = bet.answers?.find((a) => a.id === pickId)?.name ?? null;
        if (label) answers[key] = label;
      }
      if (Object.keys(answers).length) byId[mem.id] = { name: mem.name, ...answers };
      console.log(`  ${mem.name} : ${Object.keys(answers).length} réponses avant-tournoi`);
    } catch (e) {
      console.error(`  ${mem.name} (${mem.id}) échec pronos avant-tournoi : ${e.message}`);
    }
    await page.close();
  }
  await browser.close();
  return { questions: [...questions.values()], byId };
}

// Valeurs RÉELLES observées à ce jour pour les questions dérivables des résultats de matchs
// (pas le score exact, mais un décompte qui se met à jour au fil du tournoi — cf. demande :
// "pouvoir voir par exemple le nombre de matchs 0-0 jusqu'à maintenant"). "Meilleur buteur"
// n'est volontairement pas inclus : on ne scrape pas les buteurs individuels, donc pas de valeur
// honnête à afficher pour cette question.
const ROUND_LABELS = ['16es de finale', '8es de finale', 'Quarts de finale', 'Demi-finales', 'Finale'];

export function computeActuals(matches = [], rounds = []) {
  const played = matches.filter((m) => m.actualHome != null && m.actualAway != null);
  const matchsNuls = played.filter((m) => m.actualHome === 0 && m.actualAway === 0).length;

  let suisseButs = 0;
  for (const m of played) {
    if (m.home === 'Suisse') suisseButs += m.actualHome;
    else if (m.away === 'Suisse') suisseButs += m.actualAway;
  }

  // Tour le plus profond où la Suisse a joué (rounds = sortie de buildBracket) : indique si
  // elle est encore en lice à ce stade, ou si elle y a été éliminée (résultat décidé, perdant).
  let suisseParcours = null;
  for (let r = rounds.length - 1; r >= 0; r--) {
    const tie = (rounds[r]?.ties || []).find((t) => t && (t.home === 'Suisse' || t.away === 'Suisse'));
    if (!tie) continue;
    const decided = tie.actualHome != null && tie.actualAway != null;
    if (!decided) { suisseParcours = `${ROUND_LABELS[r]} (en cours)`; break; }
    const home = tie.home === 'Suisse';
    const won = home ? tie.actualHome > tie.actualAway : tie.actualAway > tie.actualHome;
    suisseParcours = won ? `au moins ${ROUND_LABELS[r]}` : `éliminée en ${ROUND_LABELS[r]}`;
    break;
  }

  return { matchsNuls, suisseButs, suisseParcours };
}

// Détection « pari déjà perdu » (mathématiquement impossible vu l'état actuel du tournoi),
// pour griser ces réponses sur la fiche du joueur — les paris encore en cours restent normaux.
const PARCOURS_ORDER = ['Phase de groupes', '16es de finale', '8es de finale', 'Quarts de finale', 'Demi-finales', 'Finale'];

// Affiche la plus profonde où `team` a joué, dans `rounds` (sortie de buildBracket).
function deepestTie(team, rounds) {
  for (let r = rounds.length - 1; r >= 0; r--) {
    const tie = (rounds[r]?.ties || []).find((t) => t && (t.home === team || t.away === team));
    if (tie) return { r, tie };
  }
  return null;
}

function isEliminated(team, rounds) {
  const found = deepestTie(team, rounds);
  if (!found || found.tie.actualHome == null) return false;
  const { tie } = found;
  const home = tie.home === team;
  const won = home ? tie.actualHome > tie.actualAway : tie.actualAway > tie.actualHome;
  return !won;
}

// « Jusqu'où ira l'équipe de Suisse ? » : perdu si le tour pronostiqué est déjà dépassé (encore
// en lice à un tour plus profond) ou ne correspond pas à son tour d'élimination effectif.
function suisseParcoursLost(predicted, rounds) {
  const idx = PARCOURS_ORDER.indexOf(predicted);
  if (idx < 0) return false;
  const found = deepestTie('Suisse', rounds);
  if (!found) return false;
  const { r, tie } = found;
  const depth = r + 1; // rounds[0] = 16es de finale = PARCOURS_ORDER[1] (index 0 = Phase de groupes)
  if (tie.actualHome != null) {
    const home = tie.home === 'Suisse';
    const won = home ? tie.actualHome > tie.actualAway : tie.actualAway > tie.actualHome;
    if (!won) return idx !== depth; // éliminée : perdu sauf pronostic exact
  }
  return idx < depth; // encore en lice : perdu si le prono est déjà dépassé
}

// Totaux qui ne peuvent que croître sur le tournoi (buts, matchs nuls) : perdu dès que le total
// actuel dépasse le chiffre pronostiqué. « plus de 15 » n'est jamais déclaré perdu en cours de route.
function numericLost(predicted, actual) {
  if (predicted === 'plus de 15' || actual == null) return false;
  const n = Number(predicted);
  return Number.isFinite(n) && actual > n;
}

// byId: sortie de scrapePretournamentFor ; rounds: sortie de buildBracket ; actuals: computeActuals(...)
// → même byId, chaque réponse enrichie d'un flag `lost.<key>` quand elle est déjà impossible.
export function annotateLost(byId, rounds, actuals) {
  const out = {};
  for (const [id, answers] of Object.entries(byId)) {
    const lost = {};
    if (answers.champion && isEliminated(answers.champion, rounds)) lost.champion = true;
    if (answers.suisseParcours && suisseParcoursLost(answers.suisseParcours, rounds)) lost.suisseParcours = true;
    if (numericLost(answers.suisseButs, actuals.suisseButs)) lost.suisseButs = true;
    if (numericLost(answers.matchsNuls, actuals.matchsNuls)) lost.matchsNuls = true;
    out[id] = { ...answers, lost };
  }
  return out;
}
