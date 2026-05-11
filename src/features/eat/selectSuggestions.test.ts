import { describe, expect, it } from 'vitest';

import rawEntries from '@/assets/data/eat-suggestions.json';
import { pickEatSuggestions } from '@/src/features/eat/selectSuggestions';
import type { DietPreferenceId, EatPhase, EatSuggestion } from '@/src/domain/types';

const ALL_DIETS: readonly DietPreferenceId[] = [
  'omnivore',
  'vegan',
  'vegetarian',
  'pescatarian',
  'meat_forward',
];

describe('pickEatSuggestions — over enriched dataset', () => {
  it('returns up to the requested count for every (phase, diet) combination', () => {
    const phases: EatPhase[] = ['during_fast', 'break_fast', 'eating_window'];
    for (const phase of phases) {
      for (const diet of ALL_DIETS) {
        const picked = pickEatSuggestions(phase, diet, 0, 2);
        expect(picked.length).toBeLessThanOrEqual(2);
        for (const s of picked) {
          expect(s.phase).toBe(phase);
          // dietExcludes never includes the active diet.
          expect(s.dietExcludes ?? []).not.toContain(diet);
          // If dietIncludes is set, it must include the active diet.
          if (s.dietIncludes && s.dietIncludes.length > 0) {
            expect(s.dietIncludes).toContain(diet);
          }
        }
      }
    }
  });

  it('returns at least one break_fast suggestion for every supported diet', () => {
    for (const diet of ALL_DIETS) {
      const picked = pickEatSuggestions('break_fast', diet, 0, 1);
      expect(picked.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('returns at least one eating_window suggestion for every supported diet', () => {
    for (const diet of ALL_DIETS) {
      const picked = pickEatSuggestions('eating_window', diet, 0, 1);
      expect(picked.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('preserves the enriched fields (ingredients, foodTypes, medicalNote) when present', () => {
    const picks = pickEatSuggestions('break_fast', 'omnivore', 1, 5);
    const enriched = picks.find((p) => p.ingredients != null && p.medicalNote != null);
    expect(enriched).toBeDefined();
    expect(enriched!.ingredients!.length).toBeGreaterThan(0);
    expect(enriched!.medicalNote!.text.length).toBeGreaterThan(20);
    expect(enriched!.medicalNote!.source.length).toBeGreaterThan(2);
  });

  it('keeps the same stable ordering for the same nonce', () => {
    const a = pickEatSuggestions('eating_window', 'vegan', 3, 3);
    const b = pickEatSuggestions('eating_window', 'vegan', 3, 3);
    expect(a.map((s) => s.id)).toEqual(b.map((s) => s.id));
  });

  it('changes ordering when the nonce changes', () => {
    const a = pickEatSuggestions('eating_window', 'omnivore', 1, 4);
    const b = pickEatSuggestions('eating_window', 'omnivore', 2, 4);
    // Same-length results, but the ordering should not be guaranteed identical.
    // Use a soft check: at least one position differs across the smallest length.
    const minLen = Math.min(a.length, b.length);
    if (minLen >= 2) {
      const ids = a.slice(0, minLen).map((s) => s.id);
      const otherIds = b.slice(0, minLen).map((s) => s.id);
      expect(ids).not.toEqual(otherIds);
    }
  });
});

describe('eat-suggestions.json — schema sanity', () => {
  it('every entry has a unique id', () => {
    const data = rawEntries as EatSuggestion[];
    const ids = new Set(data.map((e) => e.id));
    expect(ids.size).toBe(data.length);
  });

  it('every ingredient has a non-empty name', () => {
    const data = rawEntries as EatSuggestion[];
    for (const e of data) {
      if (!e.ingredients) continue;
      for (const ing of e.ingredients) {
        expect(ing.name.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('every medicalNote has both text and source', () => {
    const data = rawEntries as EatSuggestion[];
    for (const e of data) {
      if (!e.medicalNote) continue;
      expect(e.medicalNote.text.trim().length).toBeGreaterThan(10);
      expect(e.medicalNote.source.trim().length).toBeGreaterThan(2);
    }
  });
});
