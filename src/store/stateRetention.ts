import type { FastSession, WaterLogEntry } from '@/src/domain/types';

/** Keeps persisted JSON small and history screens responsive. Newest-first sessions (`[session, ...rest]`). */
export const MAX_STORED_FAST_SESSIONS = 400;

/** Water entries append chronologically (`[..., oldest, newest]`). */
export const MAX_STORED_WATER_ENTRIES = 2000;

export function trimSessionsNewestFirst(sessions: FastSession[]): FastSession[] {
  if (sessions.length <= MAX_STORED_FAST_SESSIONS) return sessions;
  return sessions.slice(0, MAX_STORED_FAST_SESSIONS);
}

export function trimWaterKeepNewest(entries: WaterLogEntry[]): WaterLogEntry[] {
  if (entries.length <= MAX_STORED_WATER_ENTRIES) return entries;
  return entries.slice(entries.length - MAX_STORED_WATER_ENTRIES);
}
