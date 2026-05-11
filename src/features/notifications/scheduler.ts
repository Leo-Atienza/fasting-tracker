import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  isMilestoneIdentifier,
  milestonesToScheduleFrom,
} from './milestones';

/**
 * Local notification scheduler — schedules the milestone reminder set at the
 * hours defined in `./milestones.ts`, starting from an active fast's start
 * time.
 *
 * Stays defensive: every public method swallows errors so a missing permission
 * or unavailable native module never crashes the JS bridge. On web this becomes
 * a no-op (the `expo-notifications` web stubs return rejected promises for
 * scheduling APIs — we silently catch).
 */

const ANDROID_CHANNEL_ID = 'fasting-milestones';

let handlerInstalled = false;

/**
 * Configure how the OS displays notifications while the app is foregrounded.
 * Called once from RootLayout. Idempotent.
 */
export function setupNotificationHandler(): void {
  if (handlerInstalled) return;
  handlerInstalled = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {
    /* native module not present — ignore */
  }
}

/**
 * Ensure the Android notification channel exists. No-op on iOS/web.
 */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Fasting milestones',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#34c759',
      sound: 'default',
      vibrationPattern: [0, 180, 120, 180],
      enableVibrate: true,
    });
  } catch {
    /* ignore */
  }
}

/**
 * Returns `true` if notifications are usable. Requests permission if not yet
 * decided. On denial, returns `false` — caller should treat as "feature off".
 */
export async function ensureNotificationsPermission(): Promise<boolean> {
  try {
    await ensureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (current.canAskAgain === false) return false;
    const req = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: false,
      },
    });
    return req.granted;
  } catch {
    return false;
  }
}

/**
 * Schedule the milestone reminder set from a given fast start.
 * Only milestones that lie in the future are scheduled. Existing fasting
 * reminders are cancelled first so re-starts don't pile up.
 */
export async function scheduleFastingMilestones(startedAtIso: string): Promise<void> {
  try {
    await ensureAndroidChannel();
    await cancelFastingMilestones();

    const planned = milestonesToScheduleFrom(startedAtIso, Date.now());
    for (const m of planned) {
      await Notifications.scheduleNotificationAsync({
        identifier: m.id,
        content: {
          title: m.title,
          body: m.body,
          sound: false,
          data: { kind: 'fasting-milestone', hours: m.hours },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: m.fireAt,
          ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : null),
        },
      });
    }
  } catch {
    /* permission revoked or native module missing — silently skip */
  }
}

/**
 * Cancel the entire milestone set. Safe to call when none are scheduled.
 */
export async function cancelFastingMilestones(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => isMilestoneIdentifier(n.identifier))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    /* ignore */
  }
}
