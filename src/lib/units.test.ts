import { describe, expect, it } from 'vitest';

import { formatVolume, mlToOz, ozToMl } from '@/src/lib/units';

describe('mlToOz / ozToMl round-trip (W8.1)', () => {
  for (const oz of [1, 8, 12, 16, 20, 32, 64]) {
    it(`mlToOz(ozToMl(${oz})) ≈ ${oz} (within ±0.05 oz)`, () => {
      const ml = ozToMl(oz);
      expect(mlToOz(ml)).toBeCloseTo(oz, 1);
    });
  }

  it('ozToMl rounds to whole ml (canonical pour math)', () => {
    expect(ozToMl(12)).toBe(355);
    expect(ozToMl(16)).toBe(473);
    expect(ozToMl(8)).toBe(237);
  });

  it('mlToOz returns a fractional number (display rounded by formatter, not by raw)', () => {
    expect(mlToOz(355)).toBeCloseTo(12.0, 1);
    expect(mlToOz(1000)).toBeCloseTo(33.81, 1);
  });
});

describe('formatVolume', () => {
  it('renders ml with no decimals', () => {
    expect(formatVolume(355, 'ml')).toBe('355 ml');
    expect(formatVolume(355.4, 'ml')).toBe('355 ml');
  });

  it('renders oz with one decimal', () => {
    expect(formatVolume(355, 'oz')).toBe('12.0 oz');
    expect(formatVolume(1000, 'oz')).toBe('33.8 oz');
  });
});
