import { describe, expect, it } from 'vitest';

import {
  isMilestoneIdentifier,
  makeMilestoneId,
  mapPermissionStatus,
  milestonesToScheduleFrom,
  MILESTONE_ID_PREFIX,
} from '@/src/features/notifications/milestones';

describe('milestonesToScheduleFrom', () => {
  it('returns all three milestones when called shortly after a fast starts', () => {
    const now = Date.UTC(2026, 4, 11, 12, 0, 0);
    const startedAt = new Date(now - 1_000).toISOString();
    const planned = milestonesToScheduleFrom(startedAt, now);
    expect(planned.map((p) => p.hours)).toEqual([12, 16, 20]);
    expect(planned[0]!.id).toBe(makeMilestoneId(12));
    expect(planned[0]!.fireAt).toBeInstanceOf(Date);
  });

  it('skips milestones that have already passed', () => {
    const now = Date.UTC(2026, 4, 11, 12, 0, 0);
    const startedAt = new Date(now - 13 * 60 * 60 * 1000).toISOString();
    const planned = milestonesToScheduleFrom(startedAt, now);
    expect(planned.map((p) => p.hours)).toEqual([16, 20]);
  });

  it('returns nothing when every milestone is in the past', () => {
    const now = Date.UTC(2026, 4, 11, 12, 0, 0);
    const startedAt = new Date(now - 21 * 60 * 60 * 1000).toISOString();
    const planned = milestonesToScheduleFrom(startedAt, now);
    expect(planned).toEqual([]);
  });

  it('skips the next milestone if its lead time is under 5 seconds', () => {
    // Fast started 12h ago minus 1s — the 12h milestone fires in ~1s, below
    // the 5s minimum lead time and must be filtered out.
    const now = Date.UTC(2026, 4, 11, 12, 0, 0);
    const startedAt = new Date(now - 12 * 60 * 60 * 1000 + 1_000).toISOString();
    const planned = milestonesToScheduleFrom(startedAt, now);
    expect(planned.map((p) => p.hours)).toEqual([16, 20]);
  });

  it('returns an empty list when the ISO string is invalid', () => {
    const planned = milestonesToScheduleFrom('not-a-date', Date.now());
    expect(planned).toEqual([]);
  });
});

describe('milestone identifiers', () => {
  it('makeMilestoneId / isMilestoneIdentifier round-trip cleanly', () => {
    const id = makeMilestoneId(16);
    expect(id).toBe(`${MILESTONE_ID_PREFIX}16h`);
    expect(isMilestoneIdentifier(id)).toBe(true);
  });

  it('rejects unrelated identifiers', () => {
    expect(isMilestoneIdentifier('foo')).toBe(false);
    expect(isMilestoneIdentifier('')).toBe(false);
    expect(isMilestoneIdentifier('fasting-other-12h')).toBe(false);
  });
});

describe('mapPermissionStatus', () => {
  it('maps granted: true to "granted"', () => {
    expect(mapPermissionStatus({ granted: true })).toBe('granted');
  });

  it('maps granted: false + canAskAgain: true to "undetermined"', () => {
    expect(mapPermissionStatus({ granted: false, canAskAgain: true })).toBe('undetermined');
  });

  it('maps granted: false + canAskAgain: false to "denied"', () => {
    expect(mapPermissionStatus({ granted: false, canAskAgain: false })).toBe('denied');
  });

  it('treats missing canAskAgain as "denied" when not granted', () => {
    expect(mapPermissionStatus({ granted: false })).toBe('denied');
  });

  it('maps null and undefined to "unsupported"', () => {
    expect(mapPermissionStatus(null)).toBe('unsupported');
    expect(mapPermissionStatus(undefined)).toBe('unsupported');
  });
});
