export const WATER_GOAL_MIN_ML = 250;
export const WATER_GOAL_MAX_ML = 5000;

export function clampWaterGoalMl(ml: number): number {
  return Math.max(WATER_GOAL_MIN_ML, Math.min(ml, WATER_GOAL_MAX_ML));
}
