import { describe, expect, it } from 'vitest';

import { computeElapsedMs, computeRingProgress } from '@/src/features/fast/elapsed';
import { getFastingStage } from '@/src/features/fast/fastingStage';

describe('computeElapsedMs (wall-clock independence)', () => {
  it('positive case: now > startedAt returns the diff', () => {
    const start = Date.parse('2026-05-10T08:00:00.000Z');
    const now = Date.parse('2026-05-10T09:30:00.000Z');
    expect(computeElapsedMs(now, '2026-05-10T08:00:00.000Z')).toBe(now - start);
  });

  it('clamps to 0 when device clock is rolled BACKWARDS (W7.1)', () => {
    const startedAtIso = '2026-05-10T10:00:00.000Z';
    const nowMs = Date.parse('2026-05-10T09:00:00.000Z');
    expect(computeElapsedMs(nowMs, startedAtIso)).toBe(0);
  });

  it('returns 0 for unparseable startedAt without throwing', () => {
    expect(computeElapsedMs(Date.now(), 'not-an-iso')).toBe(0);
    expect(computeElapsedMs(Date.now(), '')).toBe(0);
  });
});

describe('computeRingProgress (target overrun & guard rails — W7.3)', () => {
  it('returns 0 for null target (open-ended fast)', () => {
    expect(computeRingProgress(99 * 60 * 60 * 1000, null)).toBe(0);
  });

  it('returns 0 for zero or negative target', () => {
    expect(computeRingProgress(60_000, 0)).toBe(0);
    expect(computeRingProgress(60_000, -1)).toBe(0);
  });

  it('returns 0 for negative or non-finite elapsed (clamped)', () => {
    expect(computeRingProgress(-1, 60)).toBe(0);
    expect(computeRingProgress(Number.NaN, 60)).toBe(0);
    expect(computeRingProgress(Number.POSITIVE_INFINITY, 60)).toBe(1);
  });

  it('returns 0.5 at exactly half the target', () => {
    expect(computeRingProgress(30 * 60 * 1000, 60)).toBeCloseTo(0.5, 6);
  });

  it('clamps to 1 once elapsed exceeds target (target overrun)', () => {
    expect(computeRingProgress(2 * 60 * 60 * 1000, 60)).toBe(1);
    expect(computeRingProgress(99 * 60 * 60 * 1000, 16 * 60)).toBe(1);
  });

  it('returns exactly 1 when elapsed equals target', () => {
    expect(computeRingProgress(60 * 60 * 1000, 60)).toBe(1);
  });
});

describe('getFastingStage boundary minutes', () => {
  it('!isActive always returns the prep stage regardless of elapsed', () => {
    expect(getFastingStage(0, false).badge).toBe('Prep');
    expect(getFastingStage(99 * 60 * 60 * 1000, false).badge).toBe('Prep');
  });

  it('h<4 → Warm-up', () => {
    expect(getFastingStage(0, true).badge).toBe('Warm-up');
    expect(getFastingStage(3.99 * 60 * 60 * 1000, true).badge).toBe('Warm-up');
  });

  it('4<=h<12 → Steady state', () => {
    expect(getFastingStage(4 * 60 * 60 * 1000, true).badge).toBe('Steady state');
    expect(getFastingStage(11.99 * 60 * 60 * 1000, true).badge).toBe('Steady state');
  });

  it('12<=h<18 → Peak focus', () => {
    expect(getFastingStage(12 * 60 * 60 * 1000, true).badge).toBe('Peak focus');
    expect(getFastingStage(17.99 * 60 * 60 * 1000, true).badge).toBe('Peak focus');
  });

  it('h>=18 → Extended', () => {
    expect(getFastingStage(18 * 60 * 60 * 1000, true).badge).toBe('Extended');
    expect(getFastingStage(72 * 60 * 60 * 1000, true).badge).toBe('Extended');
  });
});
