/**
 * Pure layout-breakpoint helpers. Lives outside `useBreakpoint.ts` so tests can
 * exercise the boundary logic without pulling in `react-native` (which is
 * Flow-typed and can't be parsed by the vitest node environment).
 */

export type Breakpoint = 'phone' | 'tablet' | 'large';

/** Phone < 600 dp width, tablet 600–900 dp, large > 900 dp. */
export const BREAKPOINT_TABLET_MIN_DP = 600;
export const BREAKPOINT_LARGE_MIN_DP = 900;

export function breakpointForWidth(width: number): Breakpoint {
  if (width >= BREAKPOINT_LARGE_MIN_DP) return 'large';
  if (width >= BREAKPOINT_TABLET_MIN_DP) return 'tablet';
  return 'phone';
}
