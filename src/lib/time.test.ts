import { describe, expect, it } from 'vitest';

import {
  formatElapsed,
  formatAbsolute,
  formatElapsedShort,
  formatTargetHm,
  isValidIsoTimestamp,
} from '@/src/lib/time';

describe('formatElapsed', () => {
  it('pads hours, minutes, seconds', () => {
    expect(formatElapsed(3_661_001)).toBe('01:01:01');
  });

  it('treats negative as zero elapsed', () => {
    expect(formatElapsed(-999)).toBe('00:00:00');
  });
});

describe('formatAbsolute', () => {
  it('returns a localized string without throwing', () => {
    const s = formatAbsolute(new Date(Date.UTC(2026, 0, 4, 12, 30, 0)).toISOString());
    expect(s.length).toBeGreaterThan(0);
  });
});

describe('formatElapsedShort', () => {
  it('pads hours and minutes without seconds', () => {
    expect(formatElapsedShort(90 * 60 * 1000)).toBe('01:30');
    expect(formatElapsedShort(0)).toBe('00:00');
  });
});

describe('formatTargetHm', () => {
  it('formats whole hours with padded remainder minutes', () => {
    expect(formatTargetHm(16 * 60)).toBe('16:00');
    expect(formatTargetHm(90)).toBe('1:30');
  });
});

describe('isValidIsoTimestamp', () => {
  it('accepts real ISO strings', () => {
    expect(isValidIsoTimestamp('2026-01-04T12:30:00.000Z')).toBe(true);
  });

  it('rejects junk', () => {
    expect(isValidIsoTimestamp('')).toBe(false);
    expect(isValidIsoTimestamp('not a date')).toBe(false);
  });
});
