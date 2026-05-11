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

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export interface MonthlySummary {
  /** Pretty label like "May 2026", localized to `now`'s calendar month. */
  monthLabel: string;
  /** Count of fasts whose endedAt falls inside `now`'s calendar month. */
  totalFasts: number;
  /** Sum of duration for those fasts, in milliseconds. */
  totalFastedMs: number;
  /** Longest duration among those fasts, in milliseconds. */
  longestMs: number;
  /** Mean duration of those fasts, in milliseconds; 0 when none. */
  averageDurationMs: number;
  /** One entry per day of the month, oldest first. Length matches the month. */
  fastsPerDay: number[];
}

/**
 * Summary of every fast that *ended* inside `now`'s local calendar month.
 * Pure — `now` controls which month we're talking about.
 */
export function monthlySummary(
  sessions: readonly FastSession[],
  now: Date,
): MonthlySummary {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const len = daysInMonth(year, monthIndex);
  const fastsPerDay = new Array<number>(len).fill(0);

  let totalFastedMs = 0;
  let longest = 0;
  let count = 0;

  for (const s of sessions) {
    const endMs = Date.parse(s.endedAt);
    if (!Number.isFinite(endMs)) continue;
    const end = new Date(endMs);
    if (end.getFullYear() !== year || end.getMonth() !== monthIndex) continue;
    count += 1;
    const dur = sessionDurationMs(s);
    totalFastedMs += dur;
    if (dur > longest) longest = dur;
    const dayIndex = end.getDate() - 1;
    if (dayIndex >= 0 && dayIndex < len) {
      fastsPerDay[dayIndex] = (fastsPerDay[dayIndex] ?? 0) + 1;
    }
  }

  return {
    monthLabel: `${MONTH_LABELS[monthIndex] ?? ''} ${year}`,
    totalFasts: count,
    totalFastedMs,
    longestMs: longest,
    averageDurationMs: count > 0 ? Math.round(totalFastedMs / count) : 0,
    fastsPerDay,
  };
}

export interface StreakProgress {
  /** Clamped [0, 1]. 0 when no target is set. */
  ratio: number;
  /** Days left to reach the target. 0 when met or no target. */
  remaining: number;
}

/**
 * Progress toward a streak target. `targetDays === null` or `≤ 0` returns
 * `{ ratio: 0, remaining: 0 }` — the caller can still render "no goal" copy.
 */
export function streakProgress(
  currentDays: number,
  targetDays: number | null,
): StreakProgress {
  if (targetDays === null || !Number.isFinite(targetDays) || targetDays <= 0) {
    return { ratio: 0, remaining: 0 };
  }
  const safeCurrent = Number.isFinite(currentDays) ? Math.max(0, currentDays) : 0;
  const ratio = Math.max(0, Math.min(1, safeCurrent / targetDays));
  const remaining = Math.max(0, targetDays - safeCurrent);
  return { ratio, remaining };
}

export interface InsightsSnapshot {
  totalFasts: number;
  averageDurationMs: number;
  longestMs: number;
  streakDays: number;
  water7d: number[];
  fasts7d: number[];
  monthly: MonthlySummary;
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
    monthly: monthlySummary(sessions, now),
  };
}
