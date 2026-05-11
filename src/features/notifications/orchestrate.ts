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
 * - active fast appears AND reminders on AND not muted → schedule milestones
 * - active fast disappears → cancel milestones
 * - reminders turn off → cancel milestones
 * - the current fast is muted (pauseRemindersForCurrentFast) → cancel
 * - the mute is cleared AND a fast is still active → reschedule
 */
type Slice = {
  activeFast: { startedAt: string } | null;
  fastingRemindersEnabled: boolean;
  mutedFastStartedAt: string | null;
};

function selectSlice(s: ReturnType<typeof useAppStore.getState>): Slice {
  return {
    activeFast: s.activeFast,
    fastingRemindersEnabled: s.fastingRemindersEnabled,
    mutedFastStartedAt: s.mutedFastStartedAt,
  };
}

function isMutedForFast(slice: Slice): boolean {
  return (
    slice.activeFast != null &&
    slice.mutedFastStartedAt != null &&
    slice.activeFast.startedAt === slice.mutedFastStartedAt
  );
}

export function startNotificationOrchestrator(): () => void {
  // Run once with current state so we re-schedule after a cold launch with an
  // already-active fast.
  void reconcile(null, selectSlice(useAppStore.getState()));

  return useAppStore.subscribe((state, prev) => {
    void reconcile(selectSlice(prev), selectSlice(state));
  });
}

async function reconcile(prev: Slice | null, next: Slice): Promise<void> {
  const becameOff = prev?.fastingRemindersEnabled === true && next.fastingRemindersEnabled === false;
  const startedAtChanged =
    (prev?.activeFast?.startedAt ?? null) !== (next.activeFast?.startedAt ?? null);
  const wasMuted = prev ? isMutedForFast(prev) : false;
  const isMuted = isMutedForFast(next);
  const justMuted = !wasMuted && isMuted;

  // Off-states: reminders disabled, fast ended, or user just paused this fast.
  if (becameOff || (startedAtChanged && next.activeFast == null) || justMuted) {
    await cancelFastingMilestones();
    return;
  }

  // Currently muted → never reschedule. Snoozed re-fires arrive on their own.
  if (isMuted) return;

  if (next.fastingRemindersEnabled && next.activeFast && (startedAtChanged || prev == null || (wasMuted && !isMuted))) {
    const ok = await ensureNotificationsPermission();
    if (!ok) return;
    await scheduleFastingMilestones(next.activeFast.startedAt);
  }
}
