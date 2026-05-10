const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;

export function formatElapsed(ms: number): string {
  if (ms < 0) ms = 0;
  const hours = Math.floor(ms / MS_PER_HOUR);
  const minutes = Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE);
  const seconds = Math.floor((ms % MS_PER_MINUTE) / MS_PER_SECOND);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** HH:MM (no seconds) — matches Stitch hero timer typography. */
export function formatElapsedShort(ms: number): string {
  if (ms < 0) ms = 0;
  const hours = Math.floor(ms / MS_PER_HOUR);
  const minutes = Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}`;
}

/** e.g. 16:00 for a 16-hour target (hours:minutes remainder). */
export function formatTargetHm(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${h}:${pad(m)}`;
}

/** Localized time only, e.g. 8:00 PM */
export function formatTimeOnly(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { timeStyle: 'short' });
}

/** Today / Yesterday / Mon, Jan 15 */
export function relativeDayHeading(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (dayKey(d) === dayKey(now)) return 'Today';
  if (dayKey(d) === dayKey(y)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatAbsolute(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** Local-calendar day key (YYYY-MM-DD) for grouping water logs */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function isSameLocalDay(aIso: string, bIso: string): boolean {
  const a = new Date(aIso);
  const b = new Date(bIso);
  return dayKey(a) === dayKey(b);
}

export function dayKeyForIso(iso: string): string {
  return dayKey(new Date(iso));
}

/** True if the string parses to a finite instant (for persisted ISO timestamps). */
export function isValidIsoTimestamp(iso: string): boolean {
  const t = Date.parse(iso);
  return Number.isFinite(t);
}
