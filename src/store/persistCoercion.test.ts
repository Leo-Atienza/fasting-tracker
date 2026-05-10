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

  it('drops waterUnit when value is outside the {"ml","oz"} union', () => {
    expect(coercePersistedAppSlice({ waterUnit: 'liters' }).waterUnit).toBeUndefined();
    expect(coercePersistedAppSlice({ waterUnit: 7 }).waterUnit).toBeUndefined();
    expect(coercePersistedAppSlice({ waterUnit: 'oz' }).waterUnit).toBe('oz');
  });

  it('omits waterEntries when not an array, and filters bad rows when present', () => {
    expect(coercePersistedAppSlice({ waterEntries: 'nope' }).waterEntries).toBeUndefined();
    expect(coercePersistedAppSlice({}).waterEntries).toBeUndefined();
    const filtered = coercePersistedAppSlice({
      waterEntries: [
        { id: 'a', at: '2026-01-01T08:00:00.000Z', ml: 250 },
        { id: 'b', at: 'not-iso', ml: 100 },
        { id: 'c', at: '2026-01-01T09:00:00.000Z', ml: -50 },
        { id: 'd', at: '2026-01-01T10:00:00.000Z', ml: Number.NaN },
        { id: 'e', at: '2026-01-01T11:00:00.000Z', ml: 0, presetId: 'water_glass' },
        'bogus',
      ],
    });
    expect(filtered.waterEntries?.map((w) => w.id)).toEqual(['a', 'c', 'e']);
    const c = filtered.waterEntries?.find((w) => w.id === 'c');
    expect(c?.ml).toBe(0);
    expect(filtered.waterEntries?.find((w) => w.id === 'e')).toMatchObject({
      presetId: 'water_glass',
    });
  });

  it('coerces non-finite or negative eatShuffleNonce to undefined', () => {
    expect(coercePersistedAppSlice({ eatShuffleNonce: -3 }).eatShuffleNonce).toBe(0);
    expect(coercePersistedAppSlice({ eatShuffleNonce: Number.NaN }).eatShuffleNonce).toBeUndefined();
    expect(coercePersistedAppSlice({ eatShuffleNonce: '5' as unknown as number }).eatShuffleNonce)
      .toBeUndefined();
    expect(coercePersistedAppSlice({ eatShuffleNonce: 4.7 }).eatShuffleNonce).toBe(4);
  });

  it('filters non-string favoriteFactIds without throwing', () => {
    const out = coercePersistedAppSlice({
      favoriteFactIds: ['a', 1, null, 'b', { x: 1 }, 'c'],
    });
    expect(out.favoriteFactIds).toEqual(['a', 'b', 'c']);
  });
});

describe('coerceFromMigrateInput', () => {
  it('returns {} when input is null or has no state envelope and is not an object', () => {
    expect(coerceFromMigrateInput(null)).toEqual({});
    expect(coerceFromMigrateInput(undefined)).toEqual({});
    expect(coerceFromMigrateInput(42)).toEqual({});
  });

  it('coerces a bare slice (no { state } envelope) the same as the wrapped form', () => {
    const merged = coerceFromMigrateInput({ waterUnit: 'ml', hasCompletedOnboarding: true });
    expect(merged.waterUnit).toBe('ml');
    expect(merged.hasCompletedOnboarding).toBe(true);
  });

  it('ignores envelope.version (zustand passes it as a sibling field, not part of state)', () => {
    const merged = coerceFromMigrateInput({ state: { waterUnit: 'oz' }, version: undefined });
    expect(merged.waterUnit).toBe('oz');
  });

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
