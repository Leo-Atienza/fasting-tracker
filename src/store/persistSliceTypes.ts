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
