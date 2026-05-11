import {
  cancelFastingMilestones,
  ensureNotificationsPermission,
  scheduleFastingMilestones,
} from './scheduler';
import { useAppStore } from '@/src/store/useAppStore';

/**
 * Subscribe to store changes and keep the OS notification schedule in sync.
 * Returns an unsubscribe function. Call once at app boot — after the persist
 * hydration completes so we operate on real state, not defaults.
 *
 * Rules:
 * - active fast appears AND reminders on → schedule milestones
 * - active fast disappears → cancel milestones
 * - reminders turn off → cancel milestones
 * - reminders turn on AND a fast is active → schedule
 */
export function startNotificationOrchestrator(): () => void {
  type Slice = { activeFast: { startedAt: string } | null; fastingRemindersEnabled: boolean };

  const select = (s: ReturnType<typeof useAppStore.getState>): Slice => ({
    activeFast: s.activeFast,
    fastingRemindersEnabled: s.fastingRemindersEnabled,
  });

  // Run once with current state so we re-schedule after a cold launch with an
  // already-active fast.
  void reconcile(null, select(useAppStore.getState()));

  return useAppStore.subscribe((state, prev) => {
    void reconcile(select(prev), select(state));
  });
}

async function reconcile(prev: { activeFast: { startedAt: string } | null; fastingRemindersEnabled: boolean } | null, next: { activeFast: { startedAt: string } | null; fastingRemindersEnabled: boolean }): Promise<void> {
  const becameOff = prev?.fastingRemindersEnabled === true && next.fastingRemindersEnabled === false;
  const startedAtChanged = (prev?.activeFast?.startedAt ?? null) !== (next.activeFast?.startedAt ?? null);

  if (becameOff || (startedAtChanged && next.activeFast == null)) {
    await cancelFastingMilestones();
    return;
  }

  if (next.fastingRemindersEnabled && next.activeFast && (startedAtChanged || prev == null)) {
    const ok = await ensureNotificationsPermission();
    if (!ok) return;
    await scheduleFastingMilestones(next.activeFast.startedAt);
  }
}
