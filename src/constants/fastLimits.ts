/** Upper bound for “target fast duration” (minutes) — keeps ring math sane if storage is edited. */
export const MAX_FAST_TARGET_MINUTES = 10080; // 7 days

export function normalizeTargetDurationMinutes(
  raw: number | null | undefined,
): number | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) return null;
  return Math.min(Math.floor(raw), MAX_FAST_TARGET_MINUTES);
}
