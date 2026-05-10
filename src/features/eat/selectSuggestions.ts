import eatRaw from '@/assets/data/eat-suggestions.json';

import type { DietPreferenceId, EatPhase, EatSuggestion } from '@/src/domain/types';

const pool = eatRaw as EatSuggestion[];

function matchesDiet(entry: EatSuggestion, diet: DietPreferenceId): boolean {
  const exc = entry.dietExcludes;
  if (exc?.includes(diet)) return false;
  const inc = entry.dietIncludes;
  if (inc && inc.length > 0) {
    return inc.includes(diet);
  }
  return true;
}

/** Deterministic pick so the same nonce returns stable ordering until user shuffles */
export function pickEatSuggestions(
  phases: EatPhase | EatPhase[],
  diet: DietPreferenceId,
  shuffleNonce: number,
  count = 2,
): EatSuggestion[] {
  const list = Array.isArray(phases) ? phases : [phases];
  const filtered = pool.filter((s) => list.includes(s.phase) && matchesDiet(s, diet));
  if (filtered.length === 0) return [];
  const copy = [...filtered];
  let seed = shuffleNonce * 1103515245 + 12345 + copy.length * 997;
  for (let i = copy.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const j = seed % (i + 1);
    const tmp = copy[i];
    copy[i] = copy[j]!;
    copy[j] = tmp!;
  }
  return copy.slice(0, Math.min(count, copy.length));
}
