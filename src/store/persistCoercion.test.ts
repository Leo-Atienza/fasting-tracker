import { describe, expect, it } from 'vitest';

import { coerceFromMigrateInput, coercePersistedAppSlice } from '@/src/store/persistCoercion';

describe('coercePersistedAppSlice', () => {
  it('returns {} for primitives', () => {
    expect(coercePersistedAppSlice(null)).toEqual({});
    expect(coercePersistedAppSlice(undefined)).toEqual({});
    expect(coercePersistedAppSlice('x')).toEqual({});
  });

  it('keeps booleans', () => {
    expect(coercePersistedAppSlice({ hasCompletedOnboarding: true })).toMatchObject({
      hasCompletedOnboarding: true,
    });
  });

  it('drops invalid sessions and trims', () => {
    const corrupted = coercePersistedAppSlice({
      sessions: [
        {
          id: '1',
          startedAt: '2024-06-01T08:00:00.000Z',
          endedAt: '2024-06-01T20:00:00.000Z',
          targetDurationMinutes: null,
        },
        { id: '2', startedAt: 'not-a-date', endedAt: '2024-06-02T08:00:00.000Z', targetDurationMinutes: null },
        { bad: true },
      ],
    });
    expect(corrupted.sessions).toHaveLength(1);
    expect(corrupted.sessions?.[0]).toMatchObject({ id: '1' });
  });

  it('clamps water goal on hydrate', () => {
    expect(coercePersistedAppSlice({ waterDailyGoalMl: 50 }).waterDailyGoalMl).toBe(250);
    expect(coercePersistedAppSlice({ waterDailyGoalMl: 999999 }).waterDailyGoalMl).toBe(20000);
  });

  it('clears active fast when timestamps or target minutes are invalid', () => {
    expect(coercePersistedAppSlice({ activeFast: { startedAt: 'bogus', targetDurationMinutes: null } }).activeFast).toBeNull();
    expect(
      coercePersistedAppSlice({
        activeFast: { startedAt: '2026-01-01T12:00:00.000Z', targetDurationMinutes: NaN },
      }).activeFast,
    ).toBeNull();
  });

  it('drops invalid diet id', () => {
    expect(coercePersistedAppSlice({ dietPreferenceId: 'keto_undefined' }).dietPreferenceId).toBeUndefined();
    expect(coercePersistedAppSlice({ dietPreferenceId: 'vegan' }).dietPreferenceId).toBe('vegan');
  });
});

describe('coerceFromMigrateInput', () => {
  it('unwraps zustand-style { state } envelope', () => {
    const merged = coerceFromMigrateInput({
      state: {
        sessions: [
          {
            id: 'x',
            startedAt: '2024-06-01T08:00:00.000Z',
            endedAt: '2024-06-01T20:00:00.000Z',
            targetDurationMinutes: 60,
          },
        ],
        waterUnit: 'oz',
      },
    });
    expect(merged.waterUnit).toBe('oz');
    expect(merged.sessions).toHaveLength(1);
  });
});
