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
 *
 * Hardening: every call to `AccessibilityInfo.*` is wrapped in try/catch
 * because some OEM Android shells throw NotImplementedError on the
 * `reduceMotionChanged` event, and a thrown subscription would propagate
 * out of `ScalePressable`'s render, white-screening every screen that uses
 * a pressable (which is every screen).
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let sub: { remove: () => void } | null = null;

    try {
      AccessibilityInfo.isReduceMotionEnabled()
        .then((v) => {
          if (!cancelled) setReduce(v);
        })
        .catch(() => {
          if (!cancelled) setReduce(false);
        });
    } catch {
      // synchronous throw from non-standard host
    }

    try {
      sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
        setReduce(Boolean(v));
      });
    } catch {
      sub = null;
    }

    return () => {
      cancelled = true;
      try {
        sub?.remove();
      } catch {
        // noop
      }
    };
  }, []);

  return reduce;
}
