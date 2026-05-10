import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { normalizeTargetDurationMinutes } from '@/src/constants/fastLimits';
import { clampWaterGoalMl } from '@/src/constants/waterGoals';
import type {
  ActiveFast,
  DietPreferenceId,
  FastSession,
  WaterLogEntry,
  WaterUnit,
} from '@/src/domain/types';
import { coerceFromMigrateInput } from '@/src/store/persistCoercion';
import type { PersistedSlice } from '@/src/store/persistSliceTypes';
import { trimSessionsNewestFirst, trimWaterKeepNewest } from '@/src/store/stateRetention';
import { APP_STORAGE_KEY } from '@/src/storage/appStorage';
import { APP_PERSIST_SCHEMA_VERSION } from '@/src/storage/persistVersion';
import { createSafeAsyncPersistStorage } from '@/src/storage/safePersistStorage';

export type { WaterUnit } from '@/src/domain/types';

const MAX_WATER_ADD_ML = 3000;

function randomId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

interface AppSlice {
  hasCompletedOnboarding: boolean;
  dietPreferenceId: DietPreferenceId;
  /** Incremented when user taps shuffle on eat suggestions (for deterministic pick). */
  eatShuffleNonce: number;
  sessions: FastSession[];
  waterEntries: WaterLogEntry[];
  waterDailyGoalMl: number;
  waterUnit: WaterUnit;
  favoriteFactIds: string[];
  activeFast: ActiveFast | null;
}

interface AppActions {
  skipOnboarding: () => void;
  completeOnboarding: (pref: DietPreferenceId) => void;
  setDietPreferenceId: (pref: DietPreferenceId) => void;
  startFast: (opts?: { targetDurationMinutes?: number | null }) => void;
  endFast: () => void;
  removeFastSession: (id: string) => void;
  addWaterMl: (ml: number, meta?: { presetId?: string }) => void;
  removeWaterEntry: (id: string) => void;
  setWaterDailyGoalMl: (ml: number) => void;
  setWaterUnit: (u: WaterUnit) => void;
  toggleFavoriteFact: (id: string) => void;
  bumpSuggestionShuffle: () => void;
  /** Hard reset to initial state. Wipes persist on next write. */
  clearAllData: () => void;
}

export type AppStore = AppSlice & AppActions;

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      dietPreferenceId: 'omnivore',
      eatShuffleNonce: 0,
      activeFast: null,
      sessions: [],
      waterEntries: [],
      waterDailyGoalMl: 2500,
      waterUnit: 'ml',
      favoriteFactIds: [],
      skipOnboarding: () => set({ hasCompletedOnboarding: true }),
      completeOnboarding: (pref) =>
        set({ hasCompletedOnboarding: true, dietPreferenceId: pref }),
      setDietPreferenceId: (pref) => set({ dietPreferenceId: pref }),
      startFast: (opts) => {
        if (get().activeFast) return;
        const raw = opts?.targetDurationMinutes;
        const targetDurationMinutes =
          raw === undefined || raw === null
            ? null
            : (normalizeTargetDurationMinutes(raw) ?? null);
        set({
          activeFast: {
            startedAt: new Date().toISOString(),
            targetDurationMinutes,
          },
        });
      },
      endFast: () => {
        const cur = get().activeFast;
        if (!cur) return;
        const ended = new Date().toISOString();
        const session: FastSession = {
          id: randomId(),
          startedAt: cur.startedAt,
          endedAt: ended,
          targetDurationMinutes: cur.targetDurationMinutes,
        };
        set((state) => ({
          activeFast: null,
          sessions: trimSessionsNewestFirst([session, ...state.sessions]),
        }));
      },
      removeFastSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        })),
      addWaterMl: (ml, meta) => {
        const v = Math.max(0, Math.min(ml, MAX_WATER_ADD_ML));
        if (!v) return;
        const entry: WaterLogEntry = {
          id: randomId(),
          ml: v,
          at: new Date().toISOString(),
          ...(meta?.presetId ? { presetId: meta.presetId } : {}),
        };
        set((state) => ({
          waterEntries: trimWaterKeepNewest([...state.waterEntries, entry]),
        }));
      },
      removeWaterEntry: (id) =>
        set((state) => ({
          waterEntries: state.waterEntries.filter((e) => e.id !== id),
        })),
      setWaterDailyGoalMl: (ml) => {
        set({ waterDailyGoalMl: clampWaterGoalMl(ml) });
      },
      setWaterUnit: (u) => set({ waterUnit: u }),
      toggleFavoriteFact: (id) =>
        set((state) => ({
          favoriteFactIds: state.favoriteFactIds.includes(id)
            ? state.favoriteFactIds.filter((x) => x !== id)
            : [...state.favoriteFactIds, id],
        })),
      bumpSuggestionShuffle: () =>
        set((s) => ({ eatShuffleNonce: s.eatShuffleNonce + 1 })),
      clearAllData: () =>
        set({
          hasCompletedOnboarding: false,
          dietPreferenceId: 'omnivore',
          eatShuffleNonce: 0,
          activeFast: null,
          sessions: [],
          waterEntries: [],
          waterDailyGoalMl: 2500,
          waterUnit: 'ml',
          favoriteFactIds: [],
        }),
    }),
    {
      name: APP_STORAGE_KEY,
      storage: createSafeAsyncPersistStorage<Partial<PersistedSlice>>(),
      version: APP_PERSIST_SCHEMA_VERSION,
      migrate: (persisted: unknown, _fromVersion: number) => coerceFromMigrateInput(persisted),
      partialize: (s) => ({
        hasCompletedOnboarding: s.hasCompletedOnboarding,
        dietPreferenceId: s.dietPreferenceId,
        eatShuffleNonce: s.eatShuffleNonce,
        activeFast: s.activeFast,
        sessions: trimSessionsNewestFirst(s.sessions),
        waterEntries: trimWaterKeepNewest(s.waterEntries),
        waterDailyGoalMl: s.waterDailyGoalMl,
        waterUnit: s.waterUnit,
        favoriteFactIds: s.favoriteFactIds,
      }),
      /** Manual rehydrate in useStoreHydrated — avoids web/native races with splash gate. */
      skipHydration: true,
    },
  ),
);
