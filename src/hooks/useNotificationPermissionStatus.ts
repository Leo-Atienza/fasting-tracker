import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useCallback, useState } from 'react';

import {
  mapPermissionStatus,
  type NotificationPermissionStatus,
} from '@/src/features/notifications/milestones';

export type { NotificationPermissionStatus } from '@/src/features/notifications/milestones';

/**
 * Reads OS notification permission state, refreshing each time the screen
 * containing the hook regains focus. Returns `'unsupported'` if the native
 * module is unavailable or the call throws (web / dev host without prebuild).
 *
 * Pure mapping logic lives in `milestones.ts` for testability.
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
