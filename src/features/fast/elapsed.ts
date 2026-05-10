/** Wall-clock elapsed milliseconds since `startedAt`, clamped to non-negative. Returns 0 for invalid timestamps. */
export function computeElapsedMs(nowMs: number, startedAtIso: string): number {
  const start = Date.parse(startedAtIso);
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, nowMs - start);
}

/** Ring fill fraction in [0, 1]. Null/zero/negative target → 0 (no countdown ring). NaN elapsed → 0. */
export function computeRingProgress(elapsedMs: number, targetMinutes: number | null): number {
  if (targetMinutes == null || targetMinutes <= 0) return 0;
  if (Number.isNaN(elapsedMs) || elapsedMs <= 0) return 0;
  const targetMs = targetMinutes * 60 * 1000;
  return Math.min(1, elapsedMs / targetMs);
}
