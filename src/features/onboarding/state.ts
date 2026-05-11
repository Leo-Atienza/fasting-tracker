import { normalizeTargetDurationMinutes } from '@/src/constants/fastLimits';
import { clampWaterGoalMl } from '@/src/constants/waterGoals';
import type { DietPreferenceId } from '@/src/domain/types';

export type OnboardingStepId = 'fasting' | 'diet' | 'water' | 'reminders';

export interface OnboardingStep {
  readonly id: OnboardingStepId;
  readonly label: string;
}

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { id: 'fasting', label: 'Fasting Goal' },
  { id: 'diet', label: 'Dietary Profile' },
  { id: 'water', label: 'Hydration Goal' },
  { id: 'reminders', label: 'Reminders' },
] as const;

export const DEFAULT_FASTING_TARGET_MINUTES = 16 * 60;
export const DEFAULT_WATER_GOAL_ML = 2500;
export const DEFAULT_DIET: DietPreferenceId = 'omnivore';
export const DEFAULT_REMINDERS_ON = true;

export interface OnboardingSeed {
  defaultFastTargetMinutes?: number | null;
  dietPreferenceId?: DietPreferenceId;
  waterDailyGoalMl?: number;
  fastingRemindersEnabled?: boolean;
}

export interface OnboardingState {
  stepIndex: number;
  fastingTargetMinutes: number | null;
  selectedDiet: DietPreferenceId;
  waterGoalMl: number;
  remindersOn: boolean;
}

export interface OnboardingPayload {
  dietPreferenceId: DietPreferenceId;
  defaultFastTargetMinutes: number | null;
  waterDailyGoalMl: number;
  fastingRemindersEnabled: boolean;
}

export function initialOnboardingState(seed: OnboardingSeed = {}): OnboardingState {
  const seedFasting = seed.defaultFastTargetMinutes;
  return {
    stepIndex: 0,
    fastingTargetMinutes:
      seedFasting === null
        ? null
        : seedFasting === undefined
          ? DEFAULT_FASTING_TARGET_MINUTES
          : (normalizeTargetDurationMinutes(seedFasting) ?? DEFAULT_FASTING_TARGET_MINUTES),
    selectedDiet: seed.dietPreferenceId ?? DEFAULT_DIET,
    waterGoalMl: clampWaterGoalMl(seed.waterDailyGoalMl ?? DEFAULT_WATER_GOAL_ML),
    remindersOn: seed.fastingRemindersEnabled ?? DEFAULT_REMINDERS_ON,
  };
}

export function advanceStep(state: OnboardingState): OnboardingState {
  if (state.stepIndex >= ONBOARDING_STEPS.length - 1) return state;
  return { ...state, stepIndex: state.stepIndex + 1 };
}

export function backStep(state: OnboardingState): OnboardingState {
  if (state.stepIndex === 0) return state;
  return { ...state, stepIndex: state.stepIndex - 1 };
}

export function isLastStep(state: OnboardingState): boolean {
  return state.stepIndex === ONBOARDING_STEPS.length - 1;
}

export function currentStepId(state: OnboardingState): OnboardingStepId {
  return ONBOARDING_STEPS[state.stepIndex]!.id;
}

export function buildOnboardingPayload(
  state: OnboardingState,
  reminderPermissionGranted: boolean,
): OnboardingPayload {
  return {
    dietPreferenceId: state.selectedDiet,
    defaultFastTargetMinutes: state.fastingTargetMinutes,
    waterDailyGoalMl: state.waterGoalMl,
    fastingRemindersEnabled: state.remindersOn && reminderPermissionGranted,
  };
}
