import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useCallback, useState } from 'react';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

function mapPermissionStatus(
  raw: { granted?: boolean; canAskAgain?: boolean } | null | undefined,
): NotificationPermissionStatus {
  if (raw == null) return 'unsupported';
  if (raw.granted === true) return 'granted';
  if (raw.canAskAgain === true) return 'undetermined';
  return 'denied';
}

/**
 * Reads OS notification permission state, refreshing each time the screen
 * containing the hook regains focus. Returns `'unsupported'` if the native
 * module is unavailable or the call throws (web / dev host without prebuild).
 *
 * Phase 2 will extract `mapPermissionStatus` into the pure milestones module
 * so it picks up unit-test coverage.
 */
export function useNotificationPermissionStatus(): NotificationPermissionStatus {
  const [status, setStatus] = useState<NotificationPermissionStatus>('undetermined');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const res = await Notifications.getPermissionsAsync();
          if (!cancelled) setStatus(mapPermissionStatus(res));
        } catch {
          if (!cancelled) setStatus('unsupported');
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return status;
}
