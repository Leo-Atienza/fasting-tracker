/**
 * Navigation + legacy bridge. Product surfaces use FastCoachPalette.
 */
import type { ColorSchemeName } from '@/constants/FastCoachTheme';
import { FastCoachPalette } from '@/constants/FastCoachTheme';

export default {
  light: {
    text: FastCoachPalette.light.onSurface,
    background: FastCoachPalette.light.background,
    tint: FastCoachPalette.light.primary,
    tabIconDefault: FastCoachPalette.light.outline,
    tabIconSelected: FastCoachPalette.light.primary,
  },
  dark: {
    text: FastCoachPalette.dark.onSurface,
    background: FastCoachPalette.dark.background,
    tint: FastCoachPalette.dark.primary,
    tabIconDefault: FastCoachPalette.dark.outlineVariant,
    tabIconSelected: FastCoachPalette.dark.primary,
  },
} satisfies Record<ColorSchemeName, {
  text: string;
  background: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
}>;
