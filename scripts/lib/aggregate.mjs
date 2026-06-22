import { nameKey } from './members.mjs';

const keyOf = (m) => m.id || nameKey(m.name);

export function buildLatest(snapshots) {
  const sorted = [...snapshots].sort((a, b) => a.takenAt.localeCompare(b.takenAt));
  const curr = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const prevByKey = new Map((prev?.members || []).map((m) => [keyOf(m), m]));
  const members = curr.members.map((m) => {
    const p = prevByKey.get(keyOf(m));
    return {
      ...m,
      pointsDelta: p ? m.totalPoints - p.totalPoints : 0,
      rankDelta: p ? p.rank - m.rank : 0,
    };
  });
  return { takenAt: curr.takenAt, members, experts: curr.experts };
}

export function buildTimeseries(snapshots) {
  const sorted = [...snapshots].sort((a, b) => a.takenAt.localeCompare(b.takenAt));
  const series = {};
  for (const snap of sorted) {
    snap.members.forEach((m, i) => {
      const k = keyOf(m);
      // pos = position dans le classement (ordre du snapshot) → unique même en cas d'ex æquo
      (series[k] ||= []).push({ takenAt: snap.takenAt, totalPoints: m.totalPoints, rank: m.rank, pos: i + 1, name: m.name });
    });
  }
  return series;
}
