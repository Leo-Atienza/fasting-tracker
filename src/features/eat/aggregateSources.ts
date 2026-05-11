import type { EatSuggestion } from '@/src/domain/types';

/**
 * One row on the Credits screen. Aggregates how many meal presets cite the same
 * `source` so users can see at a glance which institutions back the most facts.
 */
export interface CreditSourceEntry {
  source: string;
  sourceUrl?: string;
  /** Number of meal presets that cite this source (≥1). */
  usedIn: number;
}

/**
 * Walk the eat-suggestion pool, dedupe medical notes by `source`, count
 * occurrences, and return an alphabetically-sorted list. Entries without a
 * `medicalNote` (or with an empty source string) are skipped. The first
 * non-empty `sourceUrl` seen for each source wins — keeps behavior deterministic
 * even if the data ever ships divergent URLs for the same institution.
 */
export function aggregateMedicalSources(
  suggestions: readonly EatSuggestion[],
): CreditSourceEntry[] {
  const byKey = new Map<string, CreditSourceEntry>();
  for (const s of suggestions) {
    const note = s.medicalNote;
    if (!note) continue;
    const key = note.source.trim();
    if (!key) continue;
    const existing = byKey.get(key);
    if (existing) {
      existing.usedIn += 1;
      if (!existing.sourceUrl && note.sourceUrl) {
        existing.sourceUrl = note.sourceUrl;
      }
    } else {
      byKey.set(key, {
        source: key,
        ...(note.sourceUrl ? { sourceUrl: note.sourceUrl } : {}),
        usedIn: 1,
      });
    }
  }
  return [...byKey.values()].sort((a, b) => a.source.localeCompare(b.source));
}
