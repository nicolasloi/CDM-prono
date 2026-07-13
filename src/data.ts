import latest from '../data/latest.json';
import timeseries from '../data/timeseries.json';
import pretournament from '../data/pretournament.json';
import { nameKey } from '../scripts/lib/members.mjs';

export type Member = {
  id: string | null; name: string; rank: number; totalPoints: number;
  isAdmin: boolean; pointsDelta: number; rankDelta: number;
};
export type Latest = {
  takenAt: string; members: Member[];
  experts: number[];
};
export type TsPoint = { takenAt: string; totalPoints: number; rank: number; name: string };
export type PretournamentQuestion = { id: string; key: string; question: string };
export type Pretournament = {
  questions: PretournamentQuestion[];
  byId: Record<string, { name?: string; [key: string]: any }>;
  actuals: { matchsNuls: number; suisseButs: number; suisseParcours: string | null; buteurButs: number | null; topScorerName?: string | null };
};

export const getLatest = (): Latest => latest as Latest;
export const getTimeseries = (): Record<string, TsPoint[]> => timeseries as any;
export const getPretournament = (): Pretournament => pretournament as Pretournament;
export const keyOf = (m: { id: string | null; name: string }) => m.id || nameKey(m.name);
