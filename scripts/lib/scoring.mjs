// Barème RTS officiel (cumulatif par match). Source : pronostics.rts.ch/info/rules
export const SCORING = {
  group:    { outcome: 5, totalGoals: 1, goalDiff: 3 },
  knockout: { outcome: 10, totalGoals: 2, goalDiff: 6 },
};

const sign = (a, b) => Math.sign(a - b);

export function scorePrediction(pred, actual, stage = 'group') {
  if (!pred || !actual) return 0;
  const s = SCORING[stage] || SCORING.group;
  let pts = 0;
  const outcomeOk = sign(pred.home, pred.away) === sign(actual.home, actual.away);
  if (outcomeOk) pts += s.outcome;
  if (pred.home + pred.away === actual.home + actual.away) pts += s.totalGoals;
  if (outcomeOk && pred.home - pred.away === actual.home - actual.away) pts += s.goalDiff;
  return pts;
}

export function ghostTotal(preds) {
  return preds.reduce((sum, p) => sum + (p.actual ? scorePrediction(p.result, p.actual, p.stage) : 0), 0);
}
