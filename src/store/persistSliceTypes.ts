import type {
  ActiveFast,
  DietPreferenceId,
  FastSession,
  WaterLogEntry,
  WaterUnit,
} from '@/src/domain/types';

/** Serializable slice backed by persist (matches `AppSlice` fields only). */
export interface PersistedSlice {
  hasCompletedOnboarding: boolean;
  dietPreferenceId: DietPreferenceId;
  /** User's preferred default fast length in minutes (chosen at onboarding). `null` = open-ended. */
  defaultFastTargetMinutes: number | null;
  eatShuffleNonce: number;
  activeFast: ActiveFast | null;
  sessions: FastSession[];
  waterEntries: WaterLogEntry[];
  waterDailyGoalMl: number;
  waterUnit: WaterUnit;
  favoriteFactIds: string[];
  fastingRemindersEnabled: boolean;
  premiumDismissed: boolean;
}
