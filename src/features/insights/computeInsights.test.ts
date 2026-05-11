import { describe, expect, it } from 'vitest';

import type { FastSession, WaterLogEntry } from '@/src/domain/types';
import {
  averageDurationMs,
  computeInsights,
  currentStreakDays,
  last7DaysFastsCount,
  last7DaysWaterMl,
  longestSessionMs,
  monthlySummary,
  streakProgress,
  totalCompletedFasts,
} from '@/src/features/insights/computeInsights';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function session(startMs: number, durMs: number, id = 's'): FastSession {
  return {
    id,
    startedAt: new Date(startMs).toISOString(),
    endedAt: new Date(startMs + durMs).toISOString(),
    targetDurationMinutes: null,
  };
}

function water(atMs: number, ml: number, id = 'w'): WaterLogEntry {
  return { id, ml, at: new Date(atMs).toISOString() };
}

const FIXED_NOW = new Date('2026-05-10T12:00:00').getTime();
const NOW = new Date(FIXED_NOW);

describe('insights — counters', () => {
  it('totalCompletedFasts is zero for empty', () => {
    expect(totalCompletedFasts([])).toBe(0);
  });

  it('totalCompletedFasts matches length', () => {
    const s = [
      session(FIXED_NOW - DAY, 14 * HOUR, 'a'),
      session(FIXED_NOW - 2 * DAY, 16 * HOUR, 'b'),
    ];
    expect(totalCompletedFasts(s)).toBe(2);
  });

  it('averageDurationMs returns 0 when empty', () => {
    expect(averageDurationMs([])).toBe(0);
  });

  it('averageDurationMs rounds the mean of durations', () => {
    const s = [
      session(FIXED_NOW - DAY, 14 * HOUR, 'a'),
      session(FIXED_NOW - 2 * DAY, 16 * HOUR, 'b'),
    ];
    expect(averageDurationMs(s)).toBe(15 * HOUR);
  });

  it('averageDurationMs ignores invalid timestamps (counts as 0)', () => {
    const malformed: FastSession = {
      id: 'x',
      startedAt: 'nope',
      endedAt: 'also-nope',
      targetDurationMinutes: null,
    };
    const real = session(FIXED_NOW - DAY, 10 * HOUR, 'a');
    expect(averageDurationMs([malformed, real])).toBe(5 * HOUR);
  });

  it('longestSessionMs returns 0 when empty', () => {
    expect(longestSessionMs([])).toBe(0);
  });

  it('longestSessionMs returns the max duration', () => {
    const s = [
      session(FIXED_NOW - DAY, 14 * HOUR, 'a'),
      session(FIXED_NOW - 2 * DAY, 16 * HOUR, 'b'),
      session(FIXED_NOW - 3 * DAY, 24 * HOUR, 'c'),
    ];
    expect(longestSessionMs(s)).toBe(24 * HOUR);
  });
});

describe('insights — currentStreakDays', () => {
  it('returns 0 when no sessions', () => {
    expect(currentStreakDays([], NOW)).toBe(0);
  });

  it('returns 0 when newest session is older than yesterday', () => {
    const s = [session(FIXED_NOW - 3 * DAY, 12 * HOUR, 'a')];
    expect(currentStreakDays(s, NOW)).toBe(0);
  });

  it('returns 1 if only today has a fast', () => {
    const s = [session(FIXED_NOW - 2 * HOUR, 1 * HOUR, 'a')];
    expect(currentStreakDays(s, NOW)).toBe(1);
  });

  it('returns 1 if only yesterday has a fast and today has none yet', () => {
    const s = [session(FIXED_NOW - DAY - 2 * HOUR, 1 * HOUR, 'a')];
    expect(currentStreakDays(s, NOW)).toBe(1);
  });

  it('counts a 3-day streak ending today', () => {
    const s = [
      session(FIXED_NOW - 2 * HOUR, HOUR, 'today'),
      session(FIXED_NOW - DAY - 2 * HOUR, HOUR, 'yesterday'),
      session(FIXED_NOW - 2 * DAY - 2 * HOUR, HOUR, 'd-2'),
    ];
    expect(currentStreakDays(s, NOW)).toBe(3);
  });

  it('breaks the streak on a 2+ day gap', () => {
    const s = [
      session(FIXED_NOW - 2 * HOUR, HOUR, 'today'),
      session(FIXED_NOW - 3 * DAY, HOUR, 'gap'),
      session(FIXED_NOW - 4 * DAY, HOUR, 'gap2'),
    ];
    expect(currentStreakDays(s, NOW)).toBe(1);
  });

  it('does not double-count multiple fasts on the same day', () => {
    const s = [
      session(FIXED_NOW - 2 * HOUR, HOUR, 'a'),
      session(FIXED_NOW - 4 * HOUR, HOUR, 'b'),
      session(FIXED_NOW - 6 * HOUR, HOUR, 'c'),
    ];
    expect(currentStreakDays(s, NOW)).toBe(1);
  });
});

describe('insights — 7-day windows', () => {
  it('last7DaysWaterMl returns 7 zeros for empty', () => {
    expect(last7DaysWaterMl([], NOW)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('last7DaysWaterMl sums by day, oldest first, today is index 6', () => {
    const entries = [
      water(FIXED_NOW - 2 * HOUR, 500, 'a'),
      water(FIXED_NOW - 4 * HOUR, 250, 'b'),
      water(FIXED_NOW - DAY - 2 * HOUR, 1000, 'c'),
    ];
    const out = last7DaysWaterMl(entries, NOW);
    expect(out).toHaveLength(7);
    expect(out[6]).toBe(750);
    expect(out[5]).toBe(1000);
    expect(out.slice(0, 5)).toEqual([0, 0, 0, 0, 0]);
  });

  it('last7DaysWaterMl ignores entries older than 7 days', () => {
    const old = water(FIXED_NOW - 30 * DAY, 9999, 'old');
    const recent = water(FIXED_NOW - 2 * HOUR, 250, 'recent');
    const out = last7DaysWaterMl([old, recent], NOW);
    expect(out[6]).toBe(250);
    expect(out.reduce((a, b) => a + b, 0)).toBe(250);
  });

  it('last7DaysFastsCount counts a session on the day it ENDED', () => {
    // ended just after midnight = today; started just before midnight = yesterday.
    // Streak/insights count by endedAt.
    const s = [
      session(FIXED_NOW - 2 * HOUR, HOUR, 'today'),
      session(FIXED_NOW - DAY - 3 * HOUR, HOUR, 'yesterday'),
    ];
    const out = last7DaysFastsCount(s, NOW);
    expect(out[6]).toBe(1);
    expect(out[5]).toBe(1);
  });
});

describe('insights — monthlySummary', () => {
  it('returns zeros and a full-length fastsPerDay when no sessions', () => {
    const out = monthlySummary([], NOW);
    expect(out.totalFasts).toBe(0);
    expect(out.totalFastedMs).toBe(0);
    expect(out.longestMs).toBe(0);
    expect(out.averageDurationMs).toBe(0);
    // May has 31 days.
    expect(out.fastsPerDay).toHaveLength(31);
    expect(out.fastsPerDay.every((n) => n === 0)).toBe(true);
    expect(out.monthLabel).toBe('May 2026');
  });

  it('counts only fasts whose endedAt falls in this calendar month', () => {
    // April session (ended last month) — excluded.
    const aprilEnded = session(
      new Date('2026-04-25T20:00:00').getTime(),
      14 * HOUR,
      'apr',
    );
    // May 1 session, end-of-day — included.
    const may1End = new Date('2026-05-01T22:00:00').getTime();
    const may1 = session(may1End - 14 * HOUR, 14 * HOUR, 'may1');
    // May 10 session — included.
    const may10End = new Date('2026-05-10T11:00:00').getTime();
    const may10 = session(may10End - 16 * HOUR, 16 * HOUR, 'may10');

    const out = monthlySummary([aprilEnded, may1, may10], NOW);
    expect(out.totalFasts).toBe(2);
    expect(out.totalFastedMs).toBe(14 * HOUR + 16 * HOUR);
    expect(out.longestMs).toBe(16 * HOUR);
    expect(out.averageDurationMs).toBe(Math.round((14 * HOUR + 16 * HOUR) / 2));
    expect(out.fastsPerDay[0]).toBe(1);
    expect(out.fastsPerDay[9]).toBe(1);
  });

  it('uses the calendar length of the supplied month (Feb 2026 = 28 days)', () => {
    const feb = new Date('2026-02-14T12:00:00');
    const out = monthlySummary([], feb);
    expect(out.fastsPerDay).toHaveLength(28);
    expect(out.monthLabel).toBe('February 2026');
  });
});

describe('insights — streakProgress', () => {
  it('returns 0/0 when no target is set', () => {
    expect(streakProgress(3, null)).toEqual({ ratio: 0, remaining: 0 });
  });

  it('computes a fractional ratio when the streak is below the target', () => {
    const out = streakProgress(5, 7);
    expect(out.ratio).toBeCloseTo(5 / 7, 5);
    expect(out.remaining).toBe(2);
  });

  it('clamps ratio at 1 and remaining at 0 when the streak meets/exceeds the target', () => {
    expect(streakProgress(7, 7)).toEqual({ ratio: 1, remaining: 0 });
    const exceeded = streakProgress(10, 7);
    expect(exceeded.ratio).toBe(1);
    expect(exceeded.remaining).toBe(0);
  });

  it('rejects non-positive or non-finite targets', () => {
    expect(streakProgress(3, 0)).toEqual({ ratio: 0, remaining: 0 });
    expect(streakProgress(3, -5)).toEqual({ ratio: 0, remaining: 0 });
    expect(streakProgress(3, Number.NaN)).toEqual({ ratio: 0, remaining: 0 });
  });

  it('clamps negative or non-finite current days to 0', () => {
    expect(streakProgress(-2, 7)).toEqual({ ratio: 0, remaining: 7 });
    expect(streakProgress(Number.NaN, 7)).toEqual({ ratio: 0, remaining: 7 });
  });
});

describe('insights — computeInsights aggregator', () => {
  it('returns an empty snapshot when both arrays are empty', () => {
    const out = computeInsights([], [], NOW);
    expect(out.totalFasts).toBe(0);
    expect(out.averageDurationMs).toBe(0);
    expect(out.longestMs).toBe(0);
    expect(out.streakDays).toBe(0);
    expect(out.water7d).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(out.fasts7d).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(out.monthly.totalFasts).toBe(0);
    expect(out.monthly.monthLabel).toBe('May 2026');
  });

  it('agrees with individual selectors for a non-empty case', () => {
    const s = [
      session(FIXED_NOW - 2 * HOUR, 14 * HOUR, 'a'),
      session(FIXED_NOW - DAY - 2 * HOUR, 16 * HOUR, 'b'),
    ];
    const w = [water(FIXED_NOW - 2 * HOUR, 500, 'a')];
    const out = computeInsights(s, w, NOW);
    expect(out.totalFasts).toBe(totalCompletedFasts(s));
    expect(out.averageDurationMs).toBe(averageDurationMs(s));
    expect(out.longestMs).toBe(longestSessionMs(s));
    expect(out.streakDays).toBe(currentStreakDays(s, NOW));
    expect(out.water7d).toEqual(last7DaysWaterMl(w, NOW));
    expect(out.fasts7d).toEqual(last7DaysFastsCount(s, NOW));
    expect(out.monthly).toEqual(monthlySummary(s, NOW));
  });
});
