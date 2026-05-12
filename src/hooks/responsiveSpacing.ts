/**
 * Pure width-bucket spacing helpers. Lives outside `useResponsiveSpacing.ts`
 * so vitest can exercise the boundary logic without pulling in `react-native`
 * (same separation as `breakpoint.ts` / `useBreakpoint.ts`).
 */

import { breakpointForWidth, type Breakpoint } from './breakpoint';

export type ResponsiveSpacing = {
  /** Horizontal page padding. */
  gutter: number;
  /** Vertical breath between distinct sections (Stitch's 40 px headline rule). */
  stackLg: number;
  /** Between a section heading and its first card, or between sibling cards. */
  stackMd: number;
  /** Row-level gaps within a section. */
  stackSm: number;
  /** Tight inline gaps. */
  stackXs: number;
  /** Internal padding for GlassCard surfaces. */
  glassPad: number;
  /** Extra top padding below the FixedTopBar before a hero element. */
  hero: number;
  /** Scroll padding to clear the floating tab bar. */
  tabBarBottom: number;
};

/**
 * Width-aware spacing scale that preserves Stitch's airy feel on small phones
 * (360 dp) without padding becoming so wide on tablets that content gets lost.
 *
 * Buckets (matched against `useWindowDimensions().width`, in dp):
 *  - `< 360`        small Android — 20 px gutter, 32 px section gap.
 *  - `360–413`      standard phone — 24 px gutter (canonical Stitch), 40 px section gap.
 *  - `414–599`      large phone (Pro Max et al) — 28 px gutter, 40 px section gap.
 *  - `≥ 600`        tablet / large — 32 px gutter, 48 px section gap.
 */
export function spacingForWidth(width: number): ResponsiveSpacing {
  const bp: Breakpoint = breakpointForWidth(width);
  const gutter =
    bp !== 'phone' ? 32 : width < 360 ? 20 : width < 414 ? 24 : 28;
  const stackLg = bp !== 'phone' ? 48 : width < 360 ? 32 : 40;
  return {
    gutter,
    stackLg,
    stackMd: 24,
    stackSm: 12,
    stackXs: 8,
    glassPad: 20,
    hero: 32,
    tabBarBottom: 120,
  };
}
