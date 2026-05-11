import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Local notification scheduler — schedules a small set of milestone reminders
 * at 12h, 16h, and 20h from an active fast's start time.
 *
 * Stays defensive: every public method swallows errors so a missing permission
 * or unavailable native module never crashes the JS bridge. On web this becomes
 * a no-op (the `expo-notifications` web stubs return rejected promises for
 * scheduling APIs — we silently catch).
 */

const ANDROID_CHANNEL_ID = 'fasting-milestones';

type Milestone = { hours: number; title: string; body: string };

/** Educational copy only — not medical advice. */
const MILESTONES: Milestone[] = [
  {
    hours: 12,
    title: '12 hours in — nicely held.',
    body: 'You are crossing into a metabolic-glide phase for many people. Keep sipping water.',
  },
  {
    hours: 16,
    title: '16 hours — popular checkpoint.',
    body: 'The classic 16:8 window. Notice how your appetite cues feel right now.',
  },
  {
    hours: 20,
    title: '20 hours — long-window territory.',
    body: 'Celebrate the consistency. End the fast whenever your day calls for it.',
  },
];

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
 * Schedule the 12h / 16h / 20h reminder set from a given fast start.
 * Only milestones that lie in the future are scheduled. Existing fasting
 * reminders are cancelled first so re-starts don't pile up.
 */
export async function scheduleFastingMilestones(startedAtIso: string): Promise<void> {
  try {
    const startedAt = Date.parse(startedAtIso);
    if (!Number.isFinite(startedAt)) return;

    await ensureAndroidChannel();
    await cancelFastingMilestones();

    const now = Date.now();
    for (const m of MILESTONES) {
      const fireAt = startedAt + m.hours * 60 * 60 * 1000;
      if (fireAt - now < 5_000) continue;

      await Notifications.scheduleNotificationAsync({
        identifier: makeMilestoneId(m.hours),
        content: {
          title: m.title,
          body: m.body,
          sound: false,
          data: { kind: 'fasting-milestone', hours: m.hours },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(fireAt),
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

function makeMilestoneId(hours: number): string {
  return `fasting-milestone-${hours}h`;
}

function isMilestoneIdentifier(id: string): boolean {
  return id.startsWith('fasting-milestone-');
}
