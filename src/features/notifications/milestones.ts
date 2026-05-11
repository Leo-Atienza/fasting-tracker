/**
 * Pure logic for fasting-milestone notifications. Lives outside `scheduler.ts`
 * so it can be tested without mocking the `expo-notifications` native bridge.
 *
 * Source of truth for:
 * - which milestones exist (hours, title, body)
 * - the notification identifier scheme
 * - "given a start time and now, which milestones are still future?"
 * - mapping raw permission objects to the four-state status the UI consumes
 */

export type Milestone = { hours: number; title: string; body: string };

export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'unsupported';

/** Educational copy only — not medical advice. */
export const MILESTONES: readonly Milestone[] = [
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

export const MILESTONE_ID_PREFIX = 'fasting-milestone-';

/** Minimum lead time before a milestone fires; below this, skip the schedule. */
const MIN_LEAD_MS = 5_000;

export function makeMilestoneId(hours: number): string {
  return `${MILESTONE_ID_PREFIX}${hours}h`;
}

export function isMilestoneIdentifier(id: string): boolean {
  return id.startsWith(MILESTONE_ID_PREFIX);
}

export type PlannedMilestone = {
  hours: number;
  fireAt: Date;
  id: string;
  title: string;
  body: string;
};

/**
 * Returns milestones whose fire time is strictly more than MIN_LEAD_MS in the
 * future relative to `now`. Invalid ISO input yields an empty list.
 */
export function milestonesToScheduleFrom(
  startedAtIso: string,
  now: number,
): PlannedMilestone[] {
  const startedAt = Date.parse(startedAtIso);
  if (!Number.isFinite(startedAt)) return [];

  const planned: PlannedMilestone[] = [];
  for (const m of MILESTONES) {
    const fireAtMs = startedAt + m.hours * 60 * 60 * 1000;
    if (fireAtMs - now < MIN_LEAD_MS) continue;
    planned.push({
      hours: m.hours,
      fireAt: new Date(fireAtMs),
      id: makeMilestoneId(m.hours),
      title: m.title,
      body: m.body,
    });
  }
  return planned;
}

/**
 * Reduces the raw `expo-notifications` permission response to one of four
 * states the UI can switch on. `null` / `undefined` means the native module
 * was unavailable or the call threw — treated as unsupported.
 */
export function mapPermissionStatus(
  raw: { granted?: boolean; canAskAgain?: boolean } | null | undefined,
): NotificationPermissionStatus {
  if (raw == null) return 'unsupported';
  if (raw.granted === true) return 'granted';
  if (raw.canAskAgain === true) return 'undetermined';
  return 'denied';
}
