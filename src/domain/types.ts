export type WaterUnit = 'ml' | 'oz';

export type DietPreferenceId =
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'omnivore'
  | 'meat_forward';

export type EatPhase = 'during_fast' | 'break_fast' | 'eating_window';

export type FactTheme =
  | 'metabolic'
  | 'cognition'
  | 'longevity'
  | 'general';

export interface FastSession {
  id: string;
  startedAt: string;
  endedAt: string;
  /** Target duration minutes set when fast started */
  targetDurationMinutes: number | null;
}

export interface ActiveFast {
  startedAt: string;
  targetDurationMinutes: number | null;
}

export interface WaterLogEntry {
  id: string;
  ml: number;
  at: string;
  /** Preset tapped (e.g. glass, bottle) for log UI; optional for custom/custom imports. */
  presetId?: string;
}

export interface Fact {
  id: string;
  theme: FactTheme;
  title: string;
  body: string;
}

export interface EatSuggestion {
  id: string;
  phase: EatPhase;
  title: string;
  bullets: string[];
  dietIncludes?: DietPreferenceId[];
  dietExcludes?: DietPreferenceId[];
}
