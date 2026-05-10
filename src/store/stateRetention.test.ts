import { describe, expect, it } from 'vitest';

import type { FastSession, WaterLogEntry } from '@/src/domain/types';
import {
  MAX_STORED_FAST_SESSIONS,
  MAX_STORED_WATER_ENTRIES,
  trimSessionsNewestFirst,
  trimWaterKeepNewest,
} from '@/src/store/stateRetention';

function session(id: string): FastSession {
  return {
    id,
    startedAt: `${id}_start`,
    endedAt: `${id}_end`,
    targetDurationMinutes: null,
  };
}

describe('trimSessionsNewestFirst', () => {
  it('caps at MAX_STORED_FAST_SESSIONS preserving head (newest first)', () => {
    const oversized = Array.from({ length: MAX_STORED_FAST_SESSIONS + 12 }, (_, i) =>
      session(`s${i}`),
    );
    const trimmed = trimSessionsNewestFirst(oversized);
    expect(trimmed).toHaveLength(MAX_STORED_FAST_SESSIONS);
    expect(trimmed[0]).toMatchObject({ id: 's0' });
  });

  it('is a noop under the limit', () => {
    const small = [session('a'), session('b')];
    expect(trimSessionsNewestFirst(small)).toEqual(small);
  });
});

describe('trimWaterKeepNewest', () => {
  function entry(ml: number, id: string): WaterLogEntry {
    return { id, ml, at: `${id}_at` };
  }

  it('drops oldest when over MAX_STORED_WATER_ENTRIES', () => {
    const n = MAX_STORED_WATER_ENTRIES + 5;
    const entries = Array.from({ length: n }, (_, i) => entry(i, `w${i}`));
    const trimmed = trimWaterKeepNewest(entries);
    expect(trimmed).toHaveLength(MAX_STORED_WATER_ENTRIES);
    expect(trimmed.at(0)).toMatchObject({ id: 'w5' });
    expect(trimmed.at(-1)).toMatchObject({ id: `w${n - 1}` });
  });

  it('keeps stable order relative to appended queue', () => {
    expect(trimWaterKeepNewest([entry(1, 'a'), entry(2, 'b')])).toHaveLength(2);
  });
});
