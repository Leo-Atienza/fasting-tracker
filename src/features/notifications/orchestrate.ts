import {
  cancelFastingMilestones,
  dismissPausedReminder,
  ensureNotificationsPermission,
  postPausedReminder,
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
  enabledMilestones: number[];
};

function selectSlice(s: ReturnType<typeof useAppStore.getState>): Slice {
  return {
    activeFast: s.activeFast,
    fastingRemindersEnabled: s.fastingRemindersEnabled,
    mutedFastStartedAt: s.mutedFastStartedAt,
    enabledMilestones: s.enabledMilestones,
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
  const fastEnded = startedAtChanged && next.activeFast == null;
  const wasMuted = prev ? isMutedForFast(prev) : false;
  const isMuted = isMutedForFast(next);
  const justMuted = !wasMuted && isMuted;
  const muteCleared = wasMuted && !isMuted;
  const enabledMilestonesChanged = prev != null && prev.enabledMilestones !== next.enabledMilestones;

  // Pause taken → cancel milestones, post a sticky "Reminders paused" follow-up.
  if (justMuted) {
    await cancelFastingMilestones();
    await postPausedReminder();
    return;
  }

  // Master toggle off or fast ended → cancel milestones AND clean up any paused reminder.
  if (becameOff || fastEnded) {
    await cancelFastingMilestones();
    await dismissPausedReminder();
    return;
  }

  // Still muted (no transition this tick) → leave both schedules alone.
  if (isMuted) return;

  if (
    next.fastingRemindersEnabled &&
    next.activeFast &&
    (startedAtChanged || prev == null || muteCleared || enabledMilestonesChanged)
  ) {
    // Mute just cleared (Resume tapped, or a new fast started while a prior mute lingered) →
    // dismiss the paused reminder before rescheduling so the tray doesn't show stale state.
    if (muteCleared) {
      await dismissPausedReminder();
    }
    const ok = await ensureNotificationsPermission();
    if (!ok) return;
    await scheduleFastingMilestones(next.activeFast.startedAt, next.enabledMilestones);
  }
}
