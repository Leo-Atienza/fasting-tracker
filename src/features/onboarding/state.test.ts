import { describe, expect, it } from 'vitest';

import {
  ONBOARDING_STEPS,
  advanceStep,
  backStep,
  buildOnboardingPayload,
  currentStepId,
  initialOnboardingState,
  isLastStep,
} from './state';

describe('onboarding state machine', () => {
  describe('initialOnboardingState', () => {
    it('returns the canonical defaults on empty seed', () => {
      const s = initialOnboardingState();
      expect(s).toEqual({
        stepIndex: 0,
        fastingTargetMinutes: 16 * 60,
        selectedDiet: 'omnivore',
        waterGoalMl: 2500,
        remindersOn: true,
      });
    });

    it('threads the seed fasting target through normalization', () => {
      expect(initialOnboardingState({ defaultFastTargetMinutes: 14 * 60 }).fastingTargetMinutes).toBe(
        14 * 60,
      );
      expect(initialOnboardingState({ defaultFastTargetMinutes: 9_999_999 }).fastingTargetMinutes).toBe(
        10080,
      );
    });

    it('preserves a null fasting target ("Open" goal)', () => {
      expect(initialOnboardingState({ defaultFastTargetMinutes: null }).fastingTargetMinutes).toBeNull();
    });

    it('falls back to default fast target when seed value is invalid', () => {
      expect(
        initialOnboardingState({ defaultFastTargetMinutes: Number.NaN }).fastingTargetMinutes,
      ).toBe(16 * 60);
    });

    it('clamps the water goal through clampWaterGoalMl', () => {
      expect(initialOnboardingState({ waterDailyGoalMl: 100 }).waterGoalMl).toBe(250);
      expect(initialOnboardingState({ waterDailyGoalMl: 99999 }).waterGoalMl).toBe(5000);
    });

    it('echoes the seed diet preference', () => {
      expect(initialOnboardingState({ dietPreferenceId: 'vegan' }).selectedDiet).toBe('vegan');
    });

    it('echoes the seed reminders flag (including explicit false)', () => {
      expect(initialOnboardingState({ fastingRemindersEnabled: false }).remindersOn).toBe(false);
      expect(initialOnboardingState({ fastingRemindersEnabled: true }).remindersOn).toBe(true);
    });
  });

  describe('step navigation', () => {
    it('advances through the 4-step list and clamps at the end', () => {
      let s = initialOnboardingState();
      expect(currentStepId(s)).toBe('fasting');
      s = advanceStep(s);
      expect(currentStepId(s)).toBe('diet');
      s = advanceStep(s);
      expect(currentStepId(s)).toBe('water');
      s = advanceStep(s);
      expect(currentStepId(s)).toBe('reminders');
      expect(isLastStep(s)).toBe(true);
      const sameRef = advanceStep(s);
      expect(sameRef).toBe(s);
    });

    it('walks back to step 0 and clamps at the start', () => {
      let s = advanceStep(advanceStep(initialOnboardingState()));
      expect(currentStepId(s)).toBe('water');
      s = backStep(s);
      expect(currentStepId(s)).toBe('diet');
      s = backStep(s);
      expect(currentStepId(s)).toBe('fasting');
      const sameRef = backStep(s);
      expect(sameRef).toBe(s);
    });

    it('exposes exactly four steps in the documented order', () => {
      expect(ONBOARDING_STEPS.map((step) => step.id)).toEqual([
        'fasting',
        'diet',
        'water',
        'reminders',
      ]);
    });
  });

  describe('buildOnboardingPayload', () => {
    it('maps state to the completeOnboarding payload shape', () => {
      const s = initialOnboardingState({
        defaultFastTargetMinutes: 18 * 60,
        dietPreferenceId: 'pescatarian',
        waterDailyGoalMl: 3000,
        fastingRemindersEnabled: true,
      });
      expect(buildOnboardingPayload(s, true)).toEqual({
        dietPreferenceId: 'pescatarian',
        defaultFastTargetMinutes: 18 * 60,
        waterDailyGoalMl: 3000,
        fastingRemindersEnabled: true,
      });
    });

    it('forces fastingRemindersEnabled to false when OS permission is denied', () => {
      const s = initialOnboardingState({ fastingRemindersEnabled: true });
      expect(buildOnboardingPayload(s, false).fastingRemindersEnabled).toBe(false);
    });

    it('keeps reminders off when the user opted out, regardless of permission state', () => {
      const s = initialOnboardingState({ fastingRemindersEnabled: false });
      expect(buildOnboardingPayload(s, true).fastingRemindersEnabled).toBe(false);
    });
  });
});
