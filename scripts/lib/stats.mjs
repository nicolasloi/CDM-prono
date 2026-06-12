export function biggestClimber(ts) {
  let best = { name: null, gain: -Infinity };
  for (const series of Object.values(ts)) {
    if (series.length < 2) continue;
    const gain = series.at(-1).totalPoints - series.at(-2).totalPoints;
    if (gain > best.gain) best = { name: series.at(-1).name, gain };
  }
  return best;
}

export function momentum(series) {
  if (series.length < 2) return 0;
  const last3 = series.slice(-3);
  let sum = 0;
  for (let i = 1; i < last3.length; i++) sum += last3[i].totalPoints - last3[i - 1].totalPoints;
  return sum;
}

export function badges(ts) {
  const out = [];
  let remontada = { name: null, gain: -Infinity };
  let regulier = { name: null, variance: Infinity };
  for (const series of Object.values(ts)) {
    if (series.length < 2) continue;
    const rankGain = series[0].rank - series.at(-1).rank;
    if (rankGain > remontada.gain) remontada = { name: series.at(-1).name, gain: rankGain };
    const gains = [];
    for (let i = 1; i < series.length; i++) gains.push(series[i].totalPoints - series[i - 1].totalPoints);
    const mean = gains.reduce((a, b) => a + b, 0) / gains.length;
    const variance = gains.reduce((a, b) => a + (b - mean) ** 2, 0) / gains.length;
    if (variance < regulier.variance) regulier = { name: series.at(-1).name, variance };
  }
  if (remontada.name) out.push({ label: 'La Remontada', name: remontada.name, hint: `${remontada.gain} place(s)` });
  if (regulier.name) out.push({ label: 'Le Régulier', name: regulier.name, hint: 'le plus constant' });
  return out;
}
