import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Returns `true` when the OS-level "reduce motion" accessibility flag is on,
 * and live-updates when the user toggles it without restarting the app.
 *
 * Defaults to `false` until the first async probe lands, so the first frame
 * is unaffected. Components that consume this hook should treat "true" as
 * "skip non-essential animations" (e.g. instant snap instead of timing
 * curve).
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (!cancelled) setReduce(v);
      })
      .catch(() => {
        if (!cancelled) setReduce(false);
      });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      setReduce(Boolean(v));
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return reduce;
}
