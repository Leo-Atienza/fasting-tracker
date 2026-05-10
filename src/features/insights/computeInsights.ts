import type { FastSession, WaterLogEntry } from '@/src/domain/types';
import { dayKey } from '@/src/lib/time';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Pure derivations over the persisted store slice. Every function is
 * deterministic given `now` (no `Date.now()` inside), so the insights screen
 * stays testable without a fake-timers ritual.
 */

function sessionDurationMs(s: FastSession): number {
  const start = Date.parse(s.startedAt);
  const end = Date.parse(s.endedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, end - start);
}

export function totalCompletedFasts(sessions: readonly FastSession[]): number {
  return sessions.length;
}

export function averageDurationMs(sessions: readonly FastSession[]): number {
  if (sessions.length === 0) return 0;
  const sum = sessions.reduce((acc, s) => acc + sessionDurationMs(s), 0);
  return Math.round(sum / sessions.length);
}

export function longestSessionMs(sessions: readonly FastSession[]): number {
  return sessions.reduce((max, s) => Math.max(max, sessionDurationMs(s)), 0);
}

/**
 * Returns the length of the current streak in days. A streak is consecutive
 * local-calendar days on which ≥1 fast COMPLETED (i.e. has an `endedAt`).
 *
 * Rules:
 * - If a fast ended today, streak ≥ 1.
 * - If the most recent ended fast was yesterday and today has none yet, the
 *   streak still counts (so opening the app at noon doesn't reset it).
 * - Any gap of ≥2 calendar days breaks the streak.
 */
export function currentStreakDays(
  sessions: readonly FastSession[],
  now: Date,
): number {
  if (sessions.length === 0) return 0;

  const endedKeys = new Set<string>();
  for (const s of sessions) {
    const t = Date.parse(s.endedAt);
    if (!Number.isFinite(t)) continue;
    endedKeys.add(dayKey(new Date(t)));
  }
  if (endedKeys.size === 0) return 0;

  const todayKey = dayKey(now);
  const yesterdayKey = dayKey(new Date(now.getTime() - MS_PER_DAY));

  // Streak must end today OR yesterday; otherwise it's already broken.
  let cursor: Date;
  if (endedKeys.has(todayKey)) {
    cursor = new Date(now);
  } else if (endedKeys.has(yesterdayKey)) {
    cursor = new Date(now.getTime() - MS_PER_DAY);
  } else {
    return 0;
  }

  let count = 0;
  while (endedKeys.has(dayKey(cursor))) {
    count += 1;
    cursor = new Date(cursor.getTime() - MS_PER_DAY);
  }
  return count;
}

/**
 * Returns 7 numbers (ml summed per day) oldest first. Index 6 is `now`'s day,
 * index 0 is six days ago.
 */
export function last7DaysWaterMl(
  entries: readonly WaterLogEntry[],
  now: Date,
): number[] {
  const out = new Array<number>(7).fill(0);
  const keys = new Array<string>(7);
  for (let i = 0; i < 7; i += 1) {
    keys[i] = dayKey(new Date(now.getTime() - (6 - i) * MS_PER_DAY));
  }
  for (const e of entries) {
    const t = Date.parse(e.at);
    if (!Number.isFinite(t)) continue;
    const k = dayKey(new Date(t));
    const idx = keys.indexOf(k);
    if (idx >= 0) out[idx] = (out[idx] ?? 0) + (Number.isFinite(e.ml) ? e.ml : 0);
  }
  return out;
}

/**
 * Returns 7 numbers (fast count summed per day) oldest first. Same shape as
 * `last7DaysWaterMl`. A fast is counted on the day it *ended*.
 */
export function last7DaysFastsCount(
  sessions: readonly FastSession[],
  now: Date,
): number[] {
  const out = new Array<number>(7).fill(0);
  const keys = new Array<string>(7);
  for (let i = 0; i < 7; i += 1) {
    keys[i] = dayKey(new Date(now.getTime() - (6 - i) * MS_PER_DAY));
  }
  for (const s of sessions) {
    const t = Date.parse(s.endedAt);
    if (!Number.isFinite(t)) continue;
    const k = dayKey(new Date(t));
    const idx = keys.indexOf(k);
    if (idx >= 0) out[idx] = (out[idx] ?? 0) + 1;
  }
  return out;
}

export interface InsightsSnapshot {
  totalFasts: number;
  averageDurationMs: number;
  longestMs: number;
  streakDays: number;
  water7d: number[];
  fasts7d: number[];
}

export function computeInsights(
  sessions: readonly FastSession[],
  waterEntries: readonly WaterLogEntry[],
  now: Date,
): InsightsSnapshot {
  return {
    totalFasts: totalCompletedFasts(sessions),
    averageDurationMs: averageDurationMs(sessions),
    longestMs: longestSessionMs(sessions),
    streakDays: currentStreakDays(sessions, now),
    water7d: last7DaysWaterMl(waterEntries, now),
    fasts7d: last7DaysFastsCount(sessions, now),
  };
}
