import { describe, expect, it } from 'vitest';

import { normalizeTargetDurationMinutes } from '@/src/constants/fastLimits';

describe('normalizeTargetDurationMinutes', () => {
  it('returns null for non-finite or negative', () => {
    expect(normalizeTargetDurationMinutes(undefined)).toBeNull();
    expect(normalizeTargetDurationMinutes(null)).toBeNull();
    expect(normalizeTargetDurationMinutes(NaN)).toBeNull();
    expect(normalizeTargetDurationMinutes(-1)).toBeNull();
  });

  it('floors and caps', () => {
    expect(normalizeTargetDurationMinutes(16.7)).toBe(16);
    expect(normalizeTargetDurationMinutes(999999)).toBe(10080);
  });
});
