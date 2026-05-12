/**
 * Visual tokens aligned with Stitch “Fast Coach Design System” (glass + greens + hydration blue).
 */

export type ColorSchemeName = 'light' | 'dark';

export type FastCoachPalette = {
  background: string;
  surface: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerLow: string;
  surfaceContainerLowest: string;
  surfaceVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  secondaryFixed: string;
  onSecondaryFixed: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  outline: string;
  outlineVariant: string;
  primaryFixedDim: string;
  primaryFixed: string;
  inverseSurface: string;
  glassFill: string;
  glassBorder: string;
  meshGreen: string;
  meshBlue: string;
};

export const FastCoachPalette: Record<ColorSchemeName, FastCoachPalette> = {
  light: {
    background: '#f9f9fe',
    surface: '#f9f9fe',
    surfaceContainer: '#ededf2',
    surfaceContainerHigh: '#e8e8ed',
    surfaceContainerLow: '#f3f3f8',
    surfaceContainerLowest: '#ffffff',
    surfaceVariant: '#e2e2e7',
    onSurface: '#1a1c1f',
    onSurfaceVariant: '#3d4a3c',
    primary: '#006e28',
    onPrimary: '#ffffff',
    primaryContainer: '#34c759',
    onPrimaryContainer: '#004d1a',
    secondary: '#0058bc',
    secondaryContainer: '#0070eb',
    onSecondaryContainer: '#fefcff',
    secondaryFixed: '#d8e2ff',
    onSecondaryFixed: '#001a41',
    tertiary: '#4f4ccd',
    onTertiary: '#ffffff',
    tertiaryContainer: '#a6a5ff',
    onTertiaryContainer: '#302aaf',
    error: '#ba1a1a',
    onError: '#ffffff',
    outline: '#6d7b6b',
    outlineVariant: '#bccbb8',
    primaryFixedDim: '#53e16f',
    primaryFixed: '#72fe88',
    inverseSurface: '#2e3034',
    glassFill: 'rgba(255,255,255,0.72)',
    glassBorder: 'rgba(255,255,255,0.42)',
    meshGreen: 'rgba(114,254,136,0.22)',
    meshBlue: 'rgba(0,112,235,0.14)',
  },
  dark: {
    background: '#1a1c1f',
    surface: '#1a1c1f',
    surfaceContainer: '#2e3034',
    surfaceContainerHigh: '#3a3c40',
    surfaceContainerLow: '#242628',
    surfaceContainerLowest: '#121418',
    surfaceVariant: '#3a3f45',
    onSurface: '#f0f0f5',
    onSurfaceVariant: '#bccbb8',
    primary: '#53e16f',
    onPrimary: '#002107',
    primaryContainer: '#006e28',
    onPrimaryContainer: '#72fe88',
    secondary: '#7ab8ff',
    secondaryContainer: '#004493',
    onSecondaryContainer: '#d8e2ff',
    secondaryFixed: '#004493',
    onSecondaryFixed: '#d8e2ff',
    tertiary: '#a6a5ff',
    onTertiary: '#0c006a',
    tertiaryContainer: '#302aaf',
    onTertiaryContainer: '#e2dfff',
    error: '#ffb4ab',
    onError: '#690005',
    outline: '#6d7b6b',
    outlineVariant: '#3d4a3c',
    primaryFixedDim: '#53e16f',
    primaryFixed: '#72fe88',
    inverseSurface: '#e8e8ed',
    glassFill: 'rgba(46,48,52,0.72)',
    glassBorder: 'rgba(255,255,255,0.08)',
    meshGreen: 'rgba(83,225,111,0.15)',
    meshBlue: 'rgba(0,112,235,0.22)',
  },
};

/** expo-google-fonts family names loaded in app/_layout.tsx */
export const FastCoachFonts = {
  /** Display stats & hero timer (Hanken Grotesk) */
  display: 'HankenGrotesk_800ExtraBold',
  headlineLg: 'HankenGrotesk_700Bold',
  headlineMd: 'HankenGrotesk_600SemiBold',
  body: 'Inter_400Regular',
  bodyLight: 'Inter_300Light',
  label: 'Inter_600SemiBold',
};

export const FastCoachRadii = {
  sm: 12,
  md: 18,
  lg: 26,
  xl: 28,
  full: 9999,
};

/**
 * Spacing scale aligned to Stitch "Fast Coach Design System" (4 px soft grid).
 *
 * - `gutter`: horizontal page padding (24 dp canonical).
 * - `stackLg`: vertical breath between distinct sections — the headline rule
 *   from Stitch's DESIGN.md §Layout & Spacing ("Vertical stacks use a 40px
 *   gap between distinct sections to prevent information overload").
 * - `stackMd`: between a section heading and its first card, or between sibling cards.
 * - `stackSm` / `stackXs`: row-level gaps and tight inline gaps.
 * - `glassPad`: internal padding for `GlassCard` surfaces.
 * - `hero`: extra top padding below the FixedTopBar before a hero element.
 * - `tabBarBottom`: scroll padding to clear the floating tab bar.
 *
 * Use `useResponsiveSpacing()` (src/hooks/useResponsiveSpacing.ts) when the
 * gutter / stackLg should adapt to phone width — these constants are the
 * canonical 24/40 px reference used on standard phones (360–413 dp).
 */
export const FastCoachSpacing = {
  gutter: 24,
  stackLg: 40,
  stackMd: 24,
  stackSm: 12,
  stackXs: 8,
  glassPad: 20,
  hero: 32,
  tabBarBottom: 120,
};
