import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

const { storage, asyncStorageMock } = vi.hoisted(() => {
  const storage = new Map<string, string>();
  const asyncStorageMock = {
    getItem: vi.fn((k: string) => Promise.resolve(storage.has(k) ? storage.get(k)! : null)),
    setItem: vi.fn((k: string, v: string) => {
      storage.set(k, v);
      return Promise.resolve();
    }),
    removeItem: vi.fn((k: string) => {
      storage.delete(k);
      return Promise.resolve();
    }),
  };
  return { storage, asyncStorageMock };
});

vi.mock('@react-native-async-storage/async-storage', () => ({ default: asyncStorageMock }));

const { useAppStore } = await import('@/src/store/useAppStore');
const { dayKey } = await import('@/src/lib/time');
const { selectWaterTodayMl } = await import('@/src/store/selectors');

function freshState() {
  useAppStore.setState({
    hasCompletedOnboarding: false,
    dietPreferenceId: 'omnivore',
    eatShuffleNonce: 0,
    activeFast: null,
    sessions: [],
    waterEntries: [],
    waterDailyGoalMl: 2500,
    waterUnit: 'ml',
    favoriteFactIds: [],
    mutedFastStartedAt: null,
    streakTargetDays: null,
  });
}

describe('useAppStore — fasting (W7.4 endFast TZ)', () => {
  beforeEach(() => {
    storage.clear();
    freshState();
  });

  it('startFast stamps full ISO with timezone marker (Z) for the active fast', () => {
    useAppStore.getState().startFast();
    const a = useAppStore.getState().activeFast;
    expect(a).not.toBeNull();
    expect(a!.startedAt).toMatch(/Z$/);
    expect(Number.isFinite(Date.parse(a!.startedAt))).toBe(true);
  });

  it('endFast stamps endedAt as full ISO with TZ and persists in sessions', () => {
    useAppStore.getState().startFast({ targetDurationMinutes: 16 * 60 });
    useAppStore.getState().endFast();
    const sessions = useAppStore.getState().sessions;
    expect(sessions.length).toBe(1);
    expect(sessions[0]!.endedAt).toMatch(/Z$/);
    expect(useAppStore.getState().activeFast).toBeNull();
  });

  it('endFast on no-active-fast is a no-op', () => {
    useAppStore.getState().endFast();
    expect(useAppStore.getState().sessions).toEqual([]);
  });

  it('startFast while already fasting does NOT replace the active fast', () => {
    useAppStore.getState().startFast({ targetDurationMinutes: 60 });
    const first = useAppStore.getState().activeFast!;
    useAppStore.getState().startFast({ targetDurationMinutes: 120 });
    const second = useAppStore.getState().activeFast!;
    expect(second).toEqual(first);
  });

  it('startFast normalizes target durations outside the supported range', () => {
    useAppStore.getState().startFast({ targetDurationMinutes: -10 });
    const negResult = useAppStore.getState().activeFast!;
    expect(negResult.targetDurationMinutes).toBeNull();
    useAppStore.getState().endFast();

    useAppStore.getState().startFast({ targetDurationMinutes: 9_999_999 });
    const tooBig = useAppStore.getState().activeFast!;
    expect(tooBig.targetDurationMinutes).toBe(10080);
  });
});

describe('useAppStore — water (W8.3 removeWater preserves siblings)', () => {
  beforeEach(() => {
    storage.clear();
    freshState();
  });

  it('addWaterMl ignores 0 and clamps to MAX (3000ml)', () => {
    useAppStore.getState().addWaterMl(0);
    expect(useAppStore.getState().waterEntries).toEqual([]);
    useAppStore.getState().addWaterMl(99999);
    expect(useAppStore.getState().waterEntries[0]!.ml).toBe(3000);
  });

  it('removeWaterEntry removes only the matched id, leaves others intact', () => {
    useAppStore.getState().addWaterMl(250);
    useAppStore.getState().addWaterMl(500);
    useAppStore.getState().addWaterMl(750);
    const entries = useAppStore.getState().waterEntries;
    expect(entries.length).toBe(3);
    const middleId = entries[1]!.id;
    useAppStore.getState().removeWaterEntry(middleId);
    const after = useAppStore.getState().waterEntries;
    expect(after.length).toBe(2);
    expect(after.map((e) => e.id)).not.toContain(middleId);
  });
});

describe('useAppStore — fasting history mutation (W14.1)', () => {
  beforeEach(() => {
    storage.clear();
    freshState();
  });

  it('removeFastSession on an unknown id is a no-op', () => {
    useAppStore.getState().startFast({ targetDurationMinutes: 60 });
    useAppStore.getState().endFast();
    const before = useAppStore.getState().sessions;
    expect(before.length).toBe(1);
    useAppStore.getState().removeFastSession('id-that-does-not-exist');
    expect(useAppStore.getState().sessions).toEqual(before);
  });

  it('removeFastSession removes only the matched id and preserves siblings + order', () => {
    useAppStore.getState().startFast({ targetDurationMinutes: 60 });
    useAppStore.getState().endFast();
    useAppStore.getState().startFast({ targetDurationMinutes: 120 });
    useAppStore.getState().endFast();
    useAppStore.getState().startFast({ targetDurationMinutes: 180 });
    useAppStore.getState().endFast();
    const sessions = useAppStore.getState().sessions;
    expect(sessions.length).toBe(3);
    const middleId = sessions[1]!.id;
    const expectedOrder = [sessions[0]!.id, sessions[2]!.id];
    useAppStore.getState().removeFastSession(middleId);
    const after = useAppStore.getState().sessions;
    expect(after.length).toBe(2);
    expect(after.map((s) => s.id)).toEqual(expectedOrder);
  });
});

describe('useAppStore — clearAllData (W18.1)', () => {
  beforeEach(() => {
    storage.clear();
    freshState();
  });

  it('resets every persisted field to its initial default', () => {
    useAppStore.setState({
      hasCompletedOnboarding: true,
      dietPreferenceId: 'vegan',
      eatShuffleNonce: 42,
      activeFast: { startedAt: new Date().toISOString(), targetDurationMinutes: 16 * 60 },
      sessions: [],
      waterEntries: [],
      waterDailyGoalMl: 999,
      waterUnit: 'oz',
      favoriteFactIds: ['x', 'y'],
    });
    useAppStore.getState().addWaterMl(500);
    expect(useAppStore.getState().waterEntries.length).toBe(1);

    useAppStore.getState().clearAllData();
    const s = useAppStore.getState();
    expect(s.hasCompletedOnboarding).toBe(false);
    expect(s.dietPreferenceId).toBe('omnivore');
    expect(s.eatShuffleNonce).toBe(0);
    expect(s.activeFast).toBeNull();
    expect(s.sessions).toEqual([]);
    expect(s.waterEntries).toEqual([]);
    expect(s.waterDailyGoalMl).toBe(2500);
    expect(s.waterUnit).toBe('ml');
    expect(s.favoriteFactIds).toEqual([]);
  });
});

describe('useAppStore — replayOnboarding (R5.P3)', () => {
  beforeEach(() => {
    storage.clear();
    freshState();
  });

  it('flips hasCompletedOnboarding to false', () => {
    useAppStore.setState({ hasCompletedOnboarding: true });
    useAppStore.getState().replayOnboarding();
    expect(useAppStore.getState().hasCompletedOnboarding).toBe(false);
  });

  it('preserves every other persisted field', () => {
    useAppStore.setState({
      hasCompletedOnboarding: true,
      dietPreferenceId: 'vegan',
      defaultFastTargetMinutes: 18 * 60,
      eatShuffleNonce: 7,
      activeFast: { startedAt: new Date('2026-05-10T12:00:00.000Z').toISOString(), targetDurationMinutes: 14 * 60 },
      sessions: [
        { id: 'a', startedAt: '2026-05-09T08:00:00.000Z', endedAt: '2026-05-09T20:00:00.000Z', targetDurationMinutes: 720 },
      ],
      waterEntries: [{ id: 'w1', at: '2026-05-10T09:30:00.000Z', ml: 250 }],
      waterDailyGoalMl: 3000,
      waterUnit: 'oz',
      favoriteFactIds: ['fact-1', 'fact-2'],
      fastingRemindersEnabled: false,
      premiumDismissed: true,
    });

    useAppStore.getState().replayOnboarding();
    const s = useAppStore.getState();

    expect(s.hasCompletedOnboarding).toBe(false);
    expect(s.dietPreferenceId).toBe('vegan');
    expect(s.defaultFastTargetMinutes).toBe(18 * 60);
    expect(s.eatShuffleNonce).toBe(7);
    expect(s.activeFast).toEqual({
      startedAt: '2026-05-10T12:00:00.000Z',
      targetDurationMinutes: 14 * 60,
    });
    expect(s.sessions.length).toBe(1);
    expect(s.sessions[0]!.id).toBe('a');
    expect(s.waterEntries.length).toBe(1);
    expect(s.waterEntries[0]!.id).toBe('w1');
    expect(s.waterDailyGoalMl).toBe(3000);
    expect(s.waterUnit).toBe('oz');
    expect(s.favoriteFactIds).toEqual(['fact-1', 'fact-2']);
    expect(s.fastingRemindersEnabled).toBe(false);
    expect(s.premiumDismissed).toBe(true);
  });
});

describe('useAppStore — reminder mute (R6.P3)', () => {
  beforeEach(() => {
    storage.clear();
    freshState();
  });

  it('pauseRemindersForCurrentFast sets mutedFastStartedAt to the active fast start', () => {
    useAppStore.getState().startFast({ targetDurationMinutes: 16 * 60 });
    const started = useAppStore.getState().activeFast!.startedAt;
    useAppStore.getState().pauseRemindersForCurrentFast();
    expect(useAppStore.getState().mutedFastStartedAt).toBe(started);
  });

  it('pauseRemindersForCurrentFast is a no-op when no fast is active', () => {
    useAppStore.getState().pauseRemindersForCurrentFast();
    expect(useAppStore.getState().mutedFastStartedAt).toBeNull();
  });

  it('clearReminderMute resets mutedFastStartedAt to null', () => {
    useAppStore.getState().startFast();
    useAppStore.getState().pauseRemindersForCurrentFast();
    expect(useAppStore.getState().mutedFastStartedAt).not.toBeNull();
    useAppStore.getState().clearReminderMute();
    expect(useAppStore.getState().mutedFastStartedAt).toBeNull();
  });

  it('endFast clears mutedFastStartedAt (mute is per-fast)', () => {
    useAppStore.getState().startFast();
    useAppStore.getState().pauseRemindersForCurrentFast();
    expect(useAppStore.getState().mutedFastStartedAt).not.toBeNull();
    useAppStore.getState().endFast();
    expect(useAppStore.getState().mutedFastStartedAt).toBeNull();
  });

  it('startFast clears mutedFastStartedAt — a brand new fast always nudges', () => {
    useAppStore.setState({ mutedFastStartedAt: '2026-05-01T00:00:00.000Z' });
    useAppStore.getState().startFast();
    expect(useAppStore.getState().mutedFastStartedAt).toBeNull();
  });

  it('replayOnboarding leaves mutedFastStartedAt alone (mute is per-fast, replay is per-onboarding)', () => {
    useAppStore.getState().startFast();
    useAppStore.getState().pauseRemindersForCurrentFast();
    const muted = useAppStore.getState().mutedFastStartedAt;
    useAppStore.getState().replayOnboarding();
    expect(useAppStore.getState().mutedFastStartedAt).toBe(muted);
  });

  it('clearAllData wipes mutedFastStartedAt along with everything else', () => {
    useAppStore.getState().startFast();
    useAppStore.getState().pauseRemindersForCurrentFast();
    useAppStore.getState().clearAllData();
    expect(useAppStore.getState().mutedFastStartedAt).toBeNull();
  });
});

describe('useAppStore — streak target (R6.P4)', () => {
  beforeEach(() => {
    storage.clear();
    freshState();
  });

  it('defaults to null on a fresh store', () => {
    expect(useAppStore.getState().streakTargetDays).toBeNull();
  });

  it('setStreakTargetDays accepts canonical chip values', () => {
    useAppStore.getState().setStreakTargetDays(7);
    expect(useAppStore.getState().streakTargetDays).toBe(7);
    useAppStore.getState().setStreakTargetDays(14);
    expect(useAppStore.getState().streakTargetDays).toBe(14);
    useAppStore.getState().setStreakTargetDays(30);
    expect(useAppStore.getState().streakTargetDays).toBe(30);
  });

  it('setStreakTargetDays(null) clears any prior target', () => {
    useAppStore.getState().setStreakTargetDays(14);
    useAppStore.getState().setStreakTargetDays(null);
    expect(useAppStore.getState().streakTargetDays).toBeNull();
  });

  it('setStreakTargetDays ignores zero / negative / non-finite inputs', () => {
    useAppStore.getState().setStreakTargetDays(7);
    useAppStore.getState().setStreakTargetDays(0);
    expect(useAppStore.getState().streakTargetDays).toBe(7);
    useAppStore.getState().setStreakTargetDays(-10);
    expect(useAppStore.getState().streakTargetDays).toBe(7);
    useAppStore.getState().setStreakTargetDays(Number.NaN);
    expect(useAppStore.getState().streakTargetDays).toBe(7);
  });

  it('setStreakTargetDays clamps very large values to 365 days', () => {
    useAppStore.getState().setStreakTargetDays(9999);
    expect(useAppStore.getState().streakTargetDays).toBe(365);
  });

  it('clearAllData resets streakTargetDays to null', () => {
    useAppStore.getState().setStreakTargetDays(30);
    useAppStore.getState().clearAllData();
    expect(useAppStore.getState().streakTargetDays).toBeNull();
  });
});

describe('selectWaterTodayMl — cross-midnight (W7.2 + W8.2)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-10T01:30:00.000-04:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('only counts entries whose local-day equals today', () => {
    const todayKey = dayKey();
    expect(typeof todayKey).toBe('string');
    const yesterdayLate = new Date('2026-05-09T23:59:59.999-04:00').toISOString();
    const todayEarly = new Date('2026-05-10T00:00:01.000-04:00').toISOString();
    const todayMid = new Date('2026-05-10T01:25:00.000-04:00').toISOString();

    const total = selectWaterTodayMl([
      { id: 'y', at: yesterdayLate, ml: 9999 },
      { id: 't1', at: todayEarly, ml: 250 },
      { id: 't2', at: todayMid, ml: 100 },
    ]);
    expect(total).toBe(350);
  });
});
