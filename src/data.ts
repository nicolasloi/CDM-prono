import latest from '../data/latest.json';
import timeseries from '../data/timeseries.json';
import { nameKey } from '../scripts/lib/members.mjs';

export type Member = {
  id: string | null; name: string; rank: number; totalPoints: number;
  isAdmin: boolean; pointsDelta: number; rankDelta: number;
};
export type Latest = {
  takenAt: string; members: Member[];
  otherGroups: { rank: number; name: string; points: number }[];
  experts: number[];
};
export type TsPoint = { takenAt: string; totalPoints: number; rank: number; name: string };

export const getLatest = (): Latest => latest as Latest;
export const getTimeseries = (): Record<string, TsPoint[]> => timeseries as any;
export const keyOf = (m: { id: string | null; name: string }) => m.id || nameKey(m.name);
