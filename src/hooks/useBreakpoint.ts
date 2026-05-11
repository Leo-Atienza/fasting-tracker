import { useWindowDimensions } from 'react-native';

import { breakpointForWidth, type Breakpoint } from './breakpoint';

export type { Breakpoint } from './breakpoint';
export {
  BREAKPOINT_LARGE_MIN_DP,
  BREAKPOINT_TABLET_MIN_DP,
  breakpointForWidth,
} from './breakpoint';

/**
 * Pick a layout bucket from the current window width. Re-renders on rotation
 * (`useWindowDimensions` updates) so screens reflow when the device flips.
 */
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return breakpointForWidth(width);
}
