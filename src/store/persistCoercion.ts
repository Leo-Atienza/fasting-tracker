import { DIET_PREFERENCE_IDS } from '@/src/constants/diets';
import { normalizeTargetDurationMinutes } from '@/src/constants/fastLimits';
import { clampWaterGoalMl } from '@/src/constants/waterGoals';
import { isValidIsoTimestamp } from '@/src/lib/time';
import type { DietPreferenceId, WaterUnit } from '@/src/domain/types';

import type { PersistedSlice } from './persistSliceTypes';
import { trimSessionsNewestFirst, trimWaterKeepNewest } from './stateRetention';

/** Zustand `migrate` may receive the persisted envelope `{ state, version }` or the bare slice — normalize then coerce. */
export function coerceFromMigrateInput(raw: unknown): Partial<PersistedSlice> {
  let inner = raw;
  if (inner && typeof inner === 'object' && 'state' in inner) {
    const st = (inner as { state: unknown }).state;
    inner = st;
  }
  return coercePersistedAppSlice(inner);
}

export function coercePersistedAppSlice(raw: unknown): Partial<PersistedSlice> {
  if (!raw || typeof raw !== 'object') return {};

  const o = raw as Record<string, unknown>;
  const partial: Partial<PersistedSlice> = {};

  if (typeof o.hasCompletedOnboarding === 'boolean')
    partial.hasCompletedOnboarding = o.hasCompletedOnboarding;

  const diet = DIET_PREFERENCE_IDS.find((id) => id === o.dietPreferenceId);
  if (diet) partial.dietPreferenceId = diet;

  if (o.defaultFastTargetMinutes === null) {
    partial.defaultFastTargetMinutes = null;
  } else if (typeof o.defaultFastTargetMinutes === 'number') {
    const norm = normalizeTargetDurationMinutes(o.defaultFastTargetMinutes);
    partial.defaultFastTargetMinutes = norm;
  }

  if (typeof o.eatShuffleNonce === 'number' && Number.isFinite(o.eatShuffleNonce))
    partial.eatShuffleNonce = Math.max(0, Math.floor(o.eatShuffleNonce));

  if (o.activeFast === null) partial.activeFast = null;
  else if (o.activeFast && typeof o.activeFast === 'object') {
    const f = o.activeFast as Record<string, unknown>;
    const startedAt = typeof f.startedAt === 'string' ? f.startedAt : '';
    const tdmRaw = f.targetDurationMinutes;
    if (!isValidIsoTimestamp(startedAt)) {
      partial.activeFast = null;
    } else if (tdmRaw === null || tdmRaw === undefined) {
      partial.activeFast = { startedAt, targetDurationMinutes: null };
    } else if (typeof tdmRaw === 'number') {
      const norm = normalizeTargetDurationMinutes(tdmRaw);
      partial.activeFast = norm === null ? null : { startedAt, targetDurationMinutes: norm };
    } else {
      partial.activeFast = null;
    }
  }

  if (Array.isArray(o.favoriteFactIds))
    partial.favoriteFactIds = o.favoriteFactIds.filter((x): x is string => typeof x === 'string');

  if (typeof o.waterDailyGoalMl === 'number' && Number.isFinite(o.waterDailyGoalMl))
    partial.waterDailyGoalMl = clampWaterGoalMl(o.waterDailyGoalMl);

  if (o.waterUnit === 'ml' || o.waterUnit === 'oz') partial.waterUnit = o.waterUnit as WaterUnit;

  if (typeof o.fastingRemindersEnabled === 'boolean')
    partial.fastingRemindersEnabled = o.fastingRemindersEnabled;
  if (o.mutedFastStartedAt === null) {
    partial.mutedFastStartedAt = null;
  } else if (typeof o.mutedFastStartedAt === 'string' && isValidIsoTimestamp(o.mutedFastStartedAt)) {
    partial.mutedFastStartedAt = o.mutedFastStartedAt;
  }
  if (Array.isArray(o.enabledMilestones)) {
    const validHours = [12, 16, 20];
    const filtered = o.enabledMilestones.filter(
      (x): x is number =>
        typeof x === 'number' && Number.isFinite(x) && validHours.includes(x),
    );
    partial.enabledMilestones = [...new Set(filtered)].sort((a, b) => a - b);
  }
  if (o.streakTargetDays === null) {
    partial.streakTargetDays = null;
  } else if (
    typeof o.streakTargetDays === 'number' &&
    Number.isFinite(o.streakTargetDays) &&
    o.streakTargetDays > 0
  ) {
    partial.streakTargetDays = Math.min(365, Math.floor(o.streakTargetDays));
  }
  if (typeof o.premiumDismissed === 'boolean')
    partial.premiumDismissed = o.premiumDismissed;

  if (Array.isArray(o.sessions))
    partial.sessions = trimSessionsNewestFirst(sanitizeSessions(o.sessions));
  if (Array.isArray(o.waterEntries))
    partial.waterEntries = trimWaterKeepNewest(sanitizeWater(o.waterEntries));

  return partial;
}

function sanitizeSessions(rows: unknown[]): PersistedSlice['sessions'] {
  const out: NonNullable<PersistedSlice['sessions']> = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === 'string' ? r.id : undefined;
    const startedAt = typeof r.startedAt === 'string' ? r.startedAt : undefined;
    const endedAt = typeof r.endedAt === 'string' ? r.endedAt : undefined;
    const t = r.targetDurationMinutes;
    if (!id || !startedAt || !endedAt) continue;
    if (!isValidIsoTimestamp(startedAt) || !isValidIsoTimestamp(endedAt)) continue;

    let targetDurationMinutes: number | null = null;
    if (t === null || t === undefined) targetDurationMinutes = null;
    else if (typeof t === 'number') {
      const n = normalizeTargetDurationMinutes(t);
      if (n === null) continue;
      targetDurationMinutes = n;
    } else continue;

    out.push({ id, startedAt, endedAt, targetDurationMinutes });
  }
  return out;
}

function sanitizeWater(rows: unknown[]): PersistedSlice['waterEntries'] {
  const out: NonNullable<PersistedSlice['waterEntries']> = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === 'string' ? r.id : undefined;
    const at = typeof r.at === 'string' ? r.at : undefined;
    const ml = typeof r.ml === 'number' && Number.isFinite(r.ml) ? Math.max(0, r.ml) : undefined;
    if (!id || !at || ml === undefined) continue;
    if (!isValidIsoTimestamp(at)) continue;
    const presetId =
      typeof r.presetId === 'string' && r.presetId.length > 0 ? r.presetId : undefined;
    out.push(presetId ? { id, at, ml, presetId } : { id, at, ml });
  }
  return out;
}
