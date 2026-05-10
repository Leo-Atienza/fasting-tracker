import type { FastSession, WaterLogEntry } from '@/src/domain/types';
import { dayKey, dayKeyForIso } from '@/src/lib/time';

export function selectWaterTodayMl(entries: WaterLogEntry[]): number {
  const k = dayKey();
  return entries.filter((e) => dayKeyForIso(e.at) === k).reduce((a, e) => a + e.ml, 0);
}

function endedSortKey(s: FastSession): number {
  const t = new Date(s.endedAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function sortedSessionsDescending(sessions: FastSession[]): FastSession[] {
  return [...sessions].sort((a, b) => endedSortKey(b) - endedSortKey(a));
}
