import { describe, expect, it } from 'vitest';

import {
  BREAKPOINT_LARGE_MIN_DP,
  BREAKPOINT_TABLET_MIN_DP,
  breakpointForWidth,
} from '@/src/hooks/breakpoint';

describe('breakpointForWidth', () => {
  it('returns "phone" for typical phone widths', () => {
    expect(breakpointForWidth(360)).toBe('phone');
    expect(breakpointForWidth(414)).toBe('phone');
    expect(breakpointForWidth(BREAKPOINT_TABLET_MIN_DP - 1)).toBe('phone');
  });

  it('returns "tablet" at the tablet threshold and through to large', () => {
    expect(breakpointForWidth(BREAKPOINT_TABLET_MIN_DP)).toBe('tablet');
    expect(breakpointForWidth(700)).toBe('tablet');
    expect(breakpointForWidth(BREAKPOINT_LARGE_MIN_DP - 1)).toBe('tablet');
  });

  it('returns "large" at and above the large threshold', () => {
    expect(breakpointForWidth(BREAKPOINT_LARGE_MIN_DP)).toBe('large');
    expect(breakpointForWidth(1200)).toBe('large');
    expect(breakpointForWidth(2000)).toBe('large');
  });

  it('treats zero / negative widths as phone (degenerate but safe)', () => {
    expect(breakpointForWidth(0)).toBe('phone');
    expect(breakpointForWidth(-100)).toBe('phone');
  });
});
