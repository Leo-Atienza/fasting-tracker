# Fast Coach — Round-4 Plan (post-shippable polish)

> Continuation of [PLAN_R3.md](PLAN_R3.md). The app is now demonstrably shippable: branded icons, trimmed permissions, version-sync script, 1.0.1 APK on `main`. This document captures what's worth doing next — prioritised by **value × cost**, with everything user-facing that's still missing.
>
> Conventions unchanged: one coherent commit per wave, verification gate (`npm run typecheck` + `npm run test`) between waves, never `rm` — `mv` to `TRASH/`. New: every store action ships with a unit test the same commit.

## Status going into this plan

- TypeScript strict: clean.
- Vitest: 13 files / 111 tests passing.
- APK: 1.0.1 (versionCode 10001), 144 MB debug, builds locally in <20 s incremental.
- Permissions: `INTERNET` only.
- Branch state: only `main`, locally and on origin.
- Out-of-scope confirmed: Sentry / telemetry (fully local app), auth, IAP, push notifications, weight tracking, iOS, localisation.

---

## Wave 14 — Fast-history quality of life

**Value:** users *will* mis-tap "End fast" or have a zero-minute accidental session. Right now there is no recovery path.
**Cost:** low — one store action + one row gesture.

### Tasks

- **W14.1** — add `removeFastSession(id: string)` to `useAppStore`. Filter sessions array, mirror the existing `removeWaterEntry` pattern. New tests in `src/store/useAppStore.fasting.test.ts`:
  - removing an id that doesn't exist is a no-op.
  - removing a real id leaves the other sessions intact and preserves order.
- **W14.2** — long-press on a history row opens a confirm dialog ("Remove this fast from history? This cannot be undone."). Cancel keeps. Confirm calls `removeFastSession(item.id)`. accessibilityHint on the row mentions long-press.
- **W14.3** (deferred) — full-on edit of start/end times. Punt to a future round; requires a date picker dependency or a custom one.

### Done criteria
- New tests pass.
- Manual sweep: start a 5 s fast, end it, long-press → remove → history empty again.

---

## Wave 15 — Insights tab

**Value:** the app collects rich local data (fasts, water entries, favorited facts) and displays *none* of it in aggregate. An Insights tab turns logged data into something the user can be proud of — and gives the brand-board's 4-tab nav a real reason to exist.
**Cost:** medium — one new screen, one new selector module, one tab wire-up. No new deps (we already have `react-native-svg`).

### Tasks

- **W15.1** — `src/features/insights/computeInsights.ts`:
  - `totalCompletedFasts(sessions)`
  - `averageDurationMs(sessions)` — 0 if empty
  - `longestSessionMs(sessions)` — 0 if empty
  - `currentStreakDays(sessions, today)` — consecutive days (counted by local `dayKey(endedAt)`) ending today or yesterday on which ≥1 fast completed. Today-no-fast-yet does NOT break the streak if there was one yesterday. Two-day-gap breaks it.
  - `last7DaysWaterMl(entries, today)` — array of 7 numbers, oldest first, ml summed per day.
  - `last7DaysFastsCount(sessions, today)` — same shape, fast count per day.
- **W15.2** — vitest tests for each helper with deterministic `today` fixtures (no `Date.now()`-coupled code paths).
- **W15.3** — `app/(tabs)/insights.tsx`:
  - 3 stat tiles (total / avg / longest), glass cards.
  - Streak ribbon (e.g. "🔥 3 day streak" or "Let's start one today").
  - Bar sparkline (7 columns) for water and fasts side by side, simple `View` + height-mapped bars in `palette.secondary`/`palette.primary`. Stays on-brand without pulling in a chart library.
  - Empty-state copy when there are zero fasts (mirrors history empty state).
- **W15.4** — `app/(tabs)/_layout.tsx`: add the 4th tab, choose tab order `Fast → Water → Insights → Facts`. Icon: `chart-line` from MaterialCommunityIcons.

### Done criteria
- Selectors pure, fully tested.
- Tab renders without errors when sessions is empty, when 1 session, when many sessions.
- TypeScript clean, vitest 13+ files green.

---

## Wave 16 — Local data export / import *(deferred — needs API decisions)*

**Value:** "moving to a new phone" without losing fasting history. The whole point of a local-first app.
**Cost:** medium — Share / FileSystem / Clipboard tradeoffs to decide.

### Tasks (deferred)
- Settings → "Export data" → JSON file via `expo-sharing` (new dep) OR clipboard copy of a base64-encoded JSON.
- Settings → "Import data" → paste JSON, validate via `coerceFromMigrateInput`, replace store on confirm.
- Decision point: `expo-sharing` is the most user-friendly but adds a native dep. Clipboard works today with no install.

**Punt until:** user requests it or there's a real second-device scenario.

---

## Wave 17 — Accessibility round 2

**Value:** users with motion sensitivity or vision needs. Cheap to honor.
**Cost:** low — one API hookup in two components.

### Tasks
- **W17.1** — read `AccessibilityInfo.isReduceMotionEnabled()` once at mount; expose via a `useReduceMotion()` hook in `src/hooks/`. Patch `ScalePressable` to skip the scale animation when true; patch `CircularRing` to skip the animated progress lerp when true (snap to final value instead).
- **W17.2** (manual) — spot-fix any `palette.outline` body-text uses against `palette.surfaceContainerLowest` background that fail WCAG AA (4.5:1). Replace with `palette.onSurfaceVariant` where indicated.
- **W17.3** (deferred) — font-scaling sweep needs a real device.

### Done criteria
- Toggle "Reduce motion" in Android Developer options → app no longer animates.
- Quick eyeball pass shows no obvious low-contrast labels.

---

## Wave 18 — Settings round 2

**Value:** real apps let users reset state. Without "Clear all data", first-installers can't quickly retest onboarding.
**Cost:** low — one store action with double-confirm dialog.

### Tasks
- **W18.1** — `useAppStore.clearAllData()` resets every field to the initial-state default. Double-confirm dialog: "Clear all data?" → "Are you absolutely sure? This will wipe your fast history, water log, and preferences. This cannot be undone."
- **W18.2** (deferred to Wave 16) — Export / Import buttons.

### Done criteria
- Action tested; second dialog must be visible (no auto-confirm).
- Onboarding re-runs after clear.

---

## Wave 19 — Screen-level test coverage *(deferred — RNTL setup)*

**Value:** screens currently have **zero** rendered tests. Pure logic is well-tested; screen logic is not.
**Cost:** high — needs `@testing-library/react-native` + jest-expo + a jest config, and we're currently on vitest.

### Tasks (deferred)
- Decide: stay on vitest with `react-test-renderer` (already in devDeps for `app/error.test.tsx`) and add similar tests for each screen, OR introduce jest-expo for RNTL semantics.
- Probable choice: stick with `react-test-renderer` for now — keep the toolchain simple, add `renderToTree` smoke tests for each screen that verify "renders without throwing".

**Punt until:** a real screen-level regression bites the user.

---

## Wave 20 — Version + ship

Final wave per round.

- Bump 1.0.1 → 1.0.2 once Waves 14–18 land.
- Build APK; document size delta.
- Manual install + smoke test.

---

## Final acceptance for "Round-4 ready"

- Fast history rows are deletable.
- Insights tab renders with non-trivial content when there's at least 1 fast.
- 4-tab nav (or 3+drawer; 4-tab is the design's choice).
- Reduce-motion respected when system flag is on.
- Settings → Clear all data works (and is double-gated).
- Test count ≥ 125 (we add insights selectors + removeFastSession tests; current 111).
- One coherent commit per wave.

## Explicitly *not* in scope for Round 4

- Local notifications / reminders (would add `expo-notifications` + a permission — separate epic).
- Profile screen (auth-less profiles are mostly Settings, which already exists — no real surface needed).
- Weight / measurements logging — feature creep.
- iOS verification — needs a Mac.
- Visual regression snapshots — overkill solo.
- Migrating `ScalePressable` off legacy `Animated` API — performance fine; cosmetic refactor.
- Localisation beyond English.
