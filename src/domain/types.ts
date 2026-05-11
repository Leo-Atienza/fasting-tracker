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

export type FoodCategory =
  | 'protein'
  | 'vegetable'
  | 'fruit'
  | 'grain'
  | 'fat'
  | 'dairy'
  | 'drink'
  | 'fermented'
  | 'other';

export interface MealIngredient {
  name: string;
  /** Human-readable measurement (e.g. "1 cup", "200 g", "2 tbsp"). Optional for items where the measurement is obvious. */
  amount?: string;
}

export interface MealMedicalNote {
  /** Educational copy — not medical advice. */
  text: string;
  /** Short institutional attribution (e.g. "NIH NIA", "NEJM 2019 review"). */
  source: string;
  /** Optional canonical URL — surfaced on the credits row when present. */
  sourceUrl?: string;
}

export interface EatSuggestion {
  id: string;
  phase: EatPhase;
  title: string;
  bullets: string[];
  dietIncludes?: DietPreferenceId[];
  dietExcludes?: DietPreferenceId[];
  /** Hand-curated ingredient list with measurements. Optional — older entries pass through unchanged. */
  ingredients?: MealIngredient[];
  /** Food groups represented (1-4 typical). */
  foodTypes?: FoodCategory[];
  /** Prep time in minutes, including assembly. */
  prepMinutes?: number;
  /** Optional educational note attached to the preset. */
  medicalNote?: MealMedicalNote;
}
