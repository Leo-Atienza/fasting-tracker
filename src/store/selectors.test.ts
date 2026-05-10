import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FastSession, WaterLogEntry } from '@/src/domain/types';

import * as time from '@/src/lib/time';
import { selectWaterTodayMl, sortedSessionsDescending } from '@/src/store/selectors';

describe('sortedSessionsDescending', () => {
  it('sorts by endedAt descending', () => {
    const sessions: FastSession[] = [
      {
        id: 'a',
        startedAt: '2026-05-09T09:00:00.000Z',
        endedAt: '2026-05-09T10:00:00.000Z',
        targetDurationMinutes: null,
      },
      {
        id: 'b',
        startedAt: '2026-05-09T06:00:00.000Z',
        endedAt: '2026-05-09T12:00:00.000Z',
        targetDurationMinutes: null,
      },
      {
        id: 'c',
        startedAt: '2026-05-09T06:00:00.000Z',
        endedAt: '2026-05-09T06:05:00.000Z',
        targetDurationMinutes: null,
      },
    ];
    const ids = sortedSessionsDescending(sessions).map((s) => s.id);
    expect(ids).toEqual(['b', 'a', 'c']);
  });
});

describe('selectWaterTodayMl', () => {
  beforeEach(() => {
    vi.spyOn(time, 'dayKey').mockReturnValue('K');
    vi.spyOn(time, 'dayKeyForIso').mockReturnValue('K');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sums entries that match mocked local day keys', () => {
    const entries: WaterLogEntry[] = [
      { id: '1', ml: 100, at: 'stub' },
      { id: '2', ml: 50, at: 'stub2' },
    ];
    expect(selectWaterTodayMl(entries)).toBe(150);
  });

  it('excludes mismatched iso days vs mocked calendar key', () => {
    vi.spyOn(time, 'dayKeyForIso').mockImplementation((iso: string) => (iso.endsWith('+') ? 'K' : 'OTHER'));
    const entries: WaterLogEntry[] = [
      { id: '1', ml: 250, at: '+' },
      { id: '2', ml: 1000, at: '-' },
    ];
    expect(selectWaterTodayMl(entries)).toBe(250);
  });
});
