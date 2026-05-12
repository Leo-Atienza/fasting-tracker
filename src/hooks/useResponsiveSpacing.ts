import { useWindowDimensions } from 'react-native';

import { spacingForWidth, type ResponsiveSpacing } from './responsiveSpacing';

export type { ResponsiveSpacing } from './responsiveSpacing';
export { spacingForWidth } from './responsiveSpacing';

/**
 * Pick a width-aware spacing scale from current window width. Re-renders on
 * rotation (`useWindowDimensions` updates) so screens reflow when the device
 * flips. See `responsiveSpacing.ts` for the bucket boundaries.
 */
export function useResponsiveSpacing(): ResponsiveSpacing {
  const { width } = useWindowDimensions();
  return spacingForWidth(width);
}
