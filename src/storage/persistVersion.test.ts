import { describe, expect, it } from 'vitest';

import { APP_PERSIST_SCHEMA_VERSION } from '@/src/storage/persistVersion';
import { coerceFromMigrateInput } from '@/src/store/persistCoercion';

const V0_ENVELOPE = {
  state: {
    hasCompletedOnboarding: true,
    dietPreferenceId: 'vegan',
    sessions: [
      { id: 'sess-1', startedAt: '2024-06-01T08:00:00.000Z', endedAt: '2024-06-01T20:00:00.000Z' },
    ],
    waterEntries: [{ id: 'w1', at: '2024-06-01T10:00:00.000Z', ml: 250 }],
  },
  version: 0,
};

const V1_ENVELOPE = {
  state: {
    hasCompletedOnboarding: true,
    dietPreferenceId: 'pescatarian',
    waterDailyGoalMl: 1800,
    waterUnit: 'oz',
    sessions: [
      {
        id: 'sess-2',
        startedAt: '2026-04-01T08:00:00.000Z',
        endedAt: '2026-04-01T22:00:00.000Z',
        targetDurationMinutes: 12 * 60,
      },
    ],
    waterEntries: [{ id: 'w2', at: '2026-04-01T09:00:00.000Z', ml: 500, presetId: 'water_bottle' }],
    favoriteFactIds: ['fact-keto-101'],
    eatShuffleNonce: 3,
  },
  version: 1,
};

const V_CURRENT_ENVELOPE = {
  state: {
    hasCompletedOnboarding: true,
    dietPreferenceId: 'vegetarian',
    waterDailyGoalMl: 2200,
    waterUnit: 'ml',
    activeFast: {
      startedAt: '2026-05-10T08:00:00.000Z',
      targetDurationMinutes: 16 * 60,
    },
    sessions: [],
    waterEntries: [],
    favoriteFactIds: [],
    eatShuffleNonce: 0,
  },
  version: APP_PERSIST_SCHEMA_VERSION,
};

describe('APP_PERSIST_SCHEMA_VERSION', () => {
  it('is a positive integer (changing this requires updating the migrate fixture below)', () => {
    expect(APP_PERSIST_SCHEMA_VERSION).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(APP_PERSIST_SCHEMA_VERSION)).toBe(true);
  });

  it('is referenced by useAppStore.ts persist config (regression guard against drift)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const here = path.resolve(process.cwd(), 'src/store/useAppStore.ts');
    const src = fs.readFileSync(here, 'utf8');
    expect(src).toContain('APP_PERSIST_SCHEMA_VERSION');
    expect(src).toContain('migrate:');
    expect(src).toContain('coerceFromMigrateInput');
  });
});

describe('migrate fixture rehearsal — old envelope shapes coerce to a valid current shape', () => {
  it('v0 envelope: only legacy fields → still produces a valid coerced slice', () => {
    const out = coerceFromMigrateInput(V0_ENVELOPE);
    expect(out.hasCompletedOnboarding).toBe(true);
    expect(out.dietPreferenceId).toBe('vegan');
    expect(out.sessions).toBeDefined();
    expect(out.waterEntries?.length).toBe(1);
    expect(out.waterEntries?.[0]?.ml).toBe(250);
  });

  it('v1 envelope: with `targetDurationMinutes`, `presetId`, `waterUnit` populated', () => {
    const out = coerceFromMigrateInput(V1_ENVELOPE);
    expect(out.dietPreferenceId).toBe('pescatarian');
    expect(out.waterUnit).toBe('oz');
    expect(out.waterDailyGoalMl).toBe(1800);
    expect(out.sessions?.[0]?.targetDurationMinutes).toBe(720);
    expect(out.waterEntries?.[0]?.presetId).toBe('water_bottle');
    expect(out.favoriteFactIds).toEqual(['fact-keto-101']);
    expect(out.eatShuffleNonce).toBe(3);
  });

  it('current-version envelope: passes through unchanged in shape', () => {
    const out = coerceFromMigrateInput(V_CURRENT_ENVELOPE);
    expect(out.activeFast).toEqual({
      startedAt: '2026-05-10T08:00:00.000Z',
      targetDurationMinutes: 960,
    });
    expect(out.dietPreferenceId).toBe('vegetarian');
    expect(out.waterUnit).toBe('ml');
  });

  it('v0 envelope without dietPreferenceId still produces a valid (but partial) slice', () => {
    const noDiet = { ...V0_ENVELOPE, state: { ...V0_ENVELOPE.state, dietPreferenceId: undefined } };
    const out = coerceFromMigrateInput(noDiet);
    expect(out.dietPreferenceId).toBeUndefined();
    expect(out.hasCompletedOnboarding).toBe(true);
  });

  it('envelope with state=undefined falls through to {} without throwing', () => {
    expect(coerceFromMigrateInput({ state: undefined, version: 0 })).toEqual({});
  });
});
