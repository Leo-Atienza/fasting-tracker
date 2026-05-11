import { describe, expect, it } from 'vitest';

import rawEntries from '@/assets/data/eat-suggestions.json';
import { aggregateMedicalSources } from '@/src/features/eat/aggregateSources';
import type { EatSuggestion } from '@/src/domain/types';

describe('aggregateMedicalSources', () => {
  it('returns an empty array for an empty input', () => {
    expect(aggregateMedicalSources([])).toEqual([]);
  });

  it('counts duplicate sources once with usedIn reflecting all occurrences', () => {
    const input: EatSuggestion[] = [
      {
        id: '1',
        phase: 'during_fast',
        title: 'a',
        bullets: [],
        medicalNote: { text: 'note 1', source: 'AAA', sourceUrl: 'https://aaa.example' },
      },
      {
        id: '2',
        phase: 'during_fast',
        title: 'b',
        bullets: [],
        medicalNote: { text: 'note 2', source: 'AAA', sourceUrl: 'https://aaa.example' },
      },
      {
        id: '3',
        phase: 'during_fast',
        title: 'c',
        bullets: [],
        medicalNote: { text: 'note 3', source: 'BBB' },
      },
    ];
    const out = aggregateMedicalSources(input);
    expect(out.length).toBe(2);
    const aaa = out.find((e) => e.source === 'AAA');
    expect(aaa?.usedIn).toBe(2);
    expect(aaa?.sourceUrl).toBe('https://aaa.example');
    const bbb = out.find((e) => e.source === 'BBB');
    expect(bbb?.usedIn).toBe(1);
    expect(bbb?.sourceUrl).toBeUndefined();
  });

  it('skips entries without a medicalNote', () => {
    const input: EatSuggestion[] = [
      { id: '1', phase: 'during_fast', title: 'no note', bullets: [] },
      {
        id: '2',
        phase: 'during_fast',
        title: 'with',
        bullets: [],
        medicalNote: { text: 'note', source: 'X' },
      },
    ];
    expect(aggregateMedicalSources(input).map((e) => e.source)).toEqual(['X']);
  });

  it('returns entries sorted alphabetically', () => {
    const input: EatSuggestion[] = [
      { id: '1', phase: 'during_fast', title: 'z', bullets: [], medicalNote: { text: 't', source: 'Zeta' } },
      { id: '2', phase: 'during_fast', title: 'a', bullets: [], medicalNote: { text: 't', source: 'Alpha' } },
      { id: '3', phase: 'during_fast', title: 'm', bullets: [], medicalNote: { text: 't', source: 'Mu' } },
    ];
    expect(aggregateMedicalSources(input).map((e) => e.source)).toEqual(['Alpha', 'Mu', 'Zeta']);
  });

  it('current eat-suggestions.json has between 18 and 22 unique sources', () => {
    const data = rawEntries as EatSuggestion[];
    const out = aggregateMedicalSources(data);
    expect(out.length).toBeGreaterThanOrEqual(18);
    expect(out.length).toBeLessThanOrEqual(22);
  });

  it('current eat-suggestions.json sources all carry usedIn ≥ 1', () => {
    const data = rawEntries as EatSuggestion[];
    const out = aggregateMedicalSources(data);
    for (const row of out) {
      expect(row.usedIn).toBeGreaterThanOrEqual(1);
    }
  });
});
