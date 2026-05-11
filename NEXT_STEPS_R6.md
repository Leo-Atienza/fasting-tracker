# Fasting Tracker — Round-6 Plan (v1.0.8 finish)

> Continuation of [NEXT_STEPS_R5.md](NEXT_STEPS_R5.md). v1.0.7 shipped the
> OS-permission divergence chip, milestone-scheduling tests, Replay setup,
> the monochrome notification icon + expo-system-ui module, the floating-
> tab-bar promotion of History/Settings, and the radial-gradient mesh blobs.
> This round picks up the wish list flagged at end of R5: two product
> features, one content overhaul, one test-infra phase, and three small
> cleanups.
>
> Conventions: one coherent commit per phase, verification gate
> (`npx tsc --noEmit && npm test`) between phases, never `rm` — `mv` to
> `TRASH/` with an entry in `TRASH-FILES.md`. Every store action ships with
> a unit test in the same commit.

---

## State at the start of this round

Anything below is true as of the last `main` push (commit `b422b5b`):

- **Branch:** `main`, in sync with `origin/main`. Working tree clean.
- **Version:** v1.0.7 (versionCode 10007). Bump script: `npm run bump:patch`
  keeps `package.json` / `app.json` / `android/app/build.gradle` in lockstep.
- **TypeScript:** strict, clean (`npx tsc --noEmit`).
- **Tests:** Vitest, 15 files / 152 tests passing. Config in
  [vitest.config.ts](vitest.config.ts) — `include: ['src/**/*.test.ts']`,
  `environment: 'node'`. No jsdom yet — adding it is Phase 2.
- **APK:** [android/app/build/outputs/apk/debug/app-debug.apk](android/app/build/outputs/apk/debug/app-debug.apk),
  ~143 MB, JS bundle (2.29 MB) embedded.
- **Platform scope:** Android only. iOS + web remain deferred.
- **Notable assets:** `assets/notification-icon.png` (192×192,
  white-on-transparent hourglass) is the source of the multi-dpi drawables.
  `assets/data/eat-suggestions.json` is the current meal-card pool — bullet
  lists only, no ingredients, no photos.
- **Gotchas to remember:**
  - `android/` is gitignored — every prebuild output reapplies the
    [standalone APK plugin](plugins/withStandaloneDebugApk.js) automatically.
  - `assembleRelease` is blocked on Windows by the long-path limit
    (ninja.exe is not long-path-aware); we ship `assembleDebug` with the
    bundle embedded.
  - `expo prebuild` (without `--clean`) preserves manifest edits IF the
    underlying input (app.json) drives them. Manual manifest edits are
    overwritten by prebuild — anything we want kept must live in app.json.
  - The Bash tool's CWD does not persist across calls. Always use absolute
    paths or `cd android && ./gradlew ...` in a single command.

---

## Phase 1 — Three cleanups

**Value:** clears the three small papercuts noted at the end of R5 so they
don't keep showing up in every grep / review. Two are 1-line fixes; one is
intentionally a TODO marker for the next RN upgrade.

**Cost:** low — one phase, three small edits.

### 1a — Unused `ozToMl` import in Settings

- **P1.1** In [app/(tabs)/settings.tsx:21](app/(tabs)/settings.tsx#L21),
  drop `ozToMl` from the `@/src/lib/units` import; only `formatVolume`
  and `mlToOz` are used. Pre-existing from before R5; flagged at the end
  of R5 for cleanup.

### 1b — Wire expo-system-ui to the palette background

**Why:** the module is installed (R5 P4.5) but the JS-side call is missing.
Currently the Android system background drifts to a default neutral while
the app pushes a different `background` color. With one call from
`_layout.tsx` on scheme change, the system surface tracks `palette.background`
through dark-mode switches and during back-gesture reveals.

- **P1.2** In [app/_layout.tsx](app/_layout.tsx), import
  `import * as SystemUI from 'expo-system-ui';`
- **P1.3** Inside `RootLayoutNav` (the inner component that already reads
  `colorScheme` / `p`), add a `useEffect` after the `navTheme` memo that
  calls `SystemUI.setBackgroundColorAsync(p.background)` whenever
  `p.background` changes. Wrap in try/catch and swallow — the module is
  a no-op on web, and we don't want the prebuild-not-applied dev host to
  crash on the first render.
- **P1.4** Verify the prebuild warning
  `» android: userInterfaceStyle: Install expo-system-ui` stays quiet,
  and that the system surface visually tracks the theme during a
  dark/light flip on-device (deferred — UAT after this round).

### 1c — Flag `MainApplication.kt` deprecation as a future task

**Why:** Gradle prints two Kotlin warnings every build —
`'class ReactNativeHost : Any' is deprecated`. These come from the RN
template, get regenerated on every `expo prebuild`, and will only go away
when RN ships the Bridgeless replacement. Writing a config plugin to
patch the file is real maintenance burden for a future-RN-version
problem.

- **P1.5** Add a `## Deprecation watchlist` block to
  [README.md](README.md) (or a new `DEV_NOTES.md`) calling out:
  - "Gradle warns on `class ReactNativeHost : Any`. Re-prebuild with the
    next RN upgrade and check the template no longer emits these — at
    that point we can drop this note."
- No code change needed for 1c.

### Verification

- `npx tsc --noEmit` clean.
- `npm test` — still 152 passing (Phase 1 doesn't change behavior).
- Gradle build still succeeds.

### Files touched

- Edit: `app/(tabs)/settings.tsx`
- Edit: `app/_layout.tsx`
- Edit: `README.md` (or new `DEV_NOTES.md`)

### Commit

`chore: clean up R5 papercuts (unused import, system-ui wiring, RN warning note)`

---

## Phase 2 — Onboarding component tests

**Value:** onboarding has four steps, three state transitions, and a
real-permission side-effect in step 4. Right now there is zero coverage
on the screen because vitest is `node` + `*.test.ts`. Adding the jsdom
environment is a one-time infra cost; afterward we can test any screen.

**Cost:** medium — infra setup (one new env, two new devDeps, one
mock module) plus the actual test file.

### Tasks

- **P2.1** Install dev dependencies (use `--save-dev`, no peer-dep
  drift expected on RN 0.81 / React 19):
  ```
  npm i -D jsdom @testing-library/react-native @testing-library/jest-native
  ```
  `@testing-library/react-native` is the canonical RN-component test
  library; it depends on `react-test-renderer` (already in the project).
- **P2.2** Update [vitest.config.ts](vitest.config.ts):
  - Keep the default `environment: 'node'`.
  - Add a per-file env override via the `environmentMatchGlobs` option —
    files matching `src/**/*.tsx.test.ts` use jsdom. (Alternative: split
    into two vitest configs; the override is simpler.)
  - Extend `include` to also pick up `**/*.test.tsx`.
  - Add `setupFiles: ['./src/test/setup.ts']` to define `__DEV__` and
    other globals.
- **P2.3** Create `src/test/setup.ts`:
  - Sets `(globalThis as { __DEV__?: boolean }).__DEV__ = false`.
  - Mocks `react-native` to point at `react-native-web` so JSX
    components render in jsdom. (RN's pure-node imports fail otherwise.)
  - Mocks `expo-notifications` to a minimal in-memory stub returning
    `{ granted: true }` from `getPermissionsAsync` / `requestPermissionsAsync`.
  - Mocks `@react-native-async-storage/async-storage` with the same Map
    pattern used by `useAppStore.fasting.test.ts`.
  - Mocks `expo-router` (`useRouter`, `useFocusEffect`) with a tiny stub.
- **P2.4** Create
  `src/__tests__/onboarding.test.tsx` (or `app/__tests__/...` — see note
  below) covering:
  - The 4-step flow advances on Continue, falls back on the back arrow,
    and lands on `/` after Get Started.
  - The Skip button calls `skipOnboarding` and routes to `/`.
  - Step 1 preselects the user's `defaultFastTargetMinutes` from the
    store (replays the seed).
  - Step 4 toggle is true by default when the store flag is true; flips
    on press.
  - Mounted with `<NavigationContainer>` wrapper to satisfy
    `useFocusEffect` if onboarding ever uses it.

  Note: vitest config `include` covers `src/**/*.test.tsx` not
  `app/**/*.test.tsx`. Easiest path: put the test under
  `src/__tests__/onboarding.test.tsx` and import the onboarding screen
  from its current path (`@/app/onboarding`). That keeps `app/` clean
  of test files.
- **P2.5** Verify all existing 152 tests still pass under the new
  `environmentMatchGlobs` config — `.test.ts` files keep the node env.

### Risk

- **react-native-web alias.** Some RN components don't have web parity
  (e.g. `<BlurView>`). Mocks may be needed for those — strip them down
  to `View` or `null` in the test setup.
- **expo-blur, expo-linear-gradient.** These crash hard under
  `react-native-web`. Mock them in `src/test/setup.ts`.
- **react-native-svg.** Has a web build. Should work in jsdom out of
  the box — if not, mock it.

### Verification

- `npx tsc --noEmit` clean.
- `npm test` — now `~157` cases passing (152 existing + ~5 new
  onboarding cases).

### Files touched

- Edit: `package.json`, `package-lock.json`
- Edit: `vitest.config.ts`
- New: `src/test/setup.ts`
- New: `src/__tests__/onboarding.test.tsx`

### Commit

`test(onboarding): add component-level tests under jsdom`

---

## Phase 3 — Notification snooze actions

**Value:** when a 16h milestone fires while the user is in a meeting / on
the road, they currently have no choice but to dismiss the banner — the
next nudge at 20h will still fire. Add two action buttons on each
notification:

- **Pause** — silences any remaining milestones for *this* fast (a fasted
  state can still be in progress; we just stop nudging).
- **Snooze 1h** — re-fires *this* particular milestone 1h from now,
  preserving the rest of the schedule.

**Cost:** medium — one category definition, one response listener, one
store mutation, one extension of the orchestrator's reconcile() rules,
and unit tests for the snooze math.

### Tasks

- **P3.1** Extend `src/features/notifications/milestones.ts`:
  ```ts
  export const SNOOZE_OFFSET_MS = 60 * 60 * 1000;
  export const NOTIF_CATEGORY = 'fasting-milestone';
  export const ACTION_PAUSE = 'pause';
  export const ACTION_SNOOZE = 'snooze-1h';

  /** Time at which the snoozed re-fire should land, given a tap timestamp. */
  export function snoozedFireAt(tappedAt: number): Date {
    return new Date(tappedAt + SNOOZE_OFFSET_MS);
  }
  ```
  Add tests in `milestones.test.ts` confirming `snoozedFireAt(now)` lands
  exactly `SNOOZE_OFFSET_MS` ahead of `now`.
- **P3.2** Extend `src/store/useAppStore.ts`:
  - Add `mutedFastStartedAt: string | null` to `AppSlice` — set when the
    user taps Pause; references the *startedAt* of the muted fast so the
    mute only applies to the current fast, not future ones.
  - Add `pauseRemindersForCurrentFast()` action that captures
    `get().activeFast?.startedAt ?? null` into the new field.
  - Clear `mutedFastStartedAt` whenever `activeFast` transitions (via
    `endFast`, `startFast`, or `replayOnboarding`).
  - Add it to `partialize` so the mute survives an app restart mid-fast.
  - Persist-coerce: default to `null` if missing in older payloads.
- **P3.3** Extend [src/features/notifications/scheduler.ts](src/features/notifications/scheduler.ts):
  - In `setupNotificationHandler`, also register the action category via
    `Notifications.setNotificationCategoryAsync(NOTIF_CATEGORY, [
      { identifier: ACTION_SNOOZE, buttonTitle: 'Snooze 1h', options: { isAuthenticationRequired: false } },
      { identifier: ACTION_PAUSE, buttonTitle: 'Pause', options: { isDestructive: false } },
    ])` — defensive try/catch, no-op on web.
  - In `scheduleFastingMilestones`, set `content.categoryIdentifier =
    NOTIF_CATEGORY` so the action buttons appear.
  - New export `snoozeMilestone(hours: number)` — schedules a single
    one-off notification at `now + SNOOZE_OFFSET_MS` with the same
    content as the milestone, using a derived id
    (`makeMilestoneId(hours) + '-snoozed'`).
- **P3.4** Update [src/features/notifications/orchestrate.ts](src/features/notifications/orchestrate.ts):
  - Extend the reconcile() rule set with:
    - If `mutedFastStartedAt === activeFast.startedAt`, cancel
      milestones unconditionally. Don't reschedule until either the
      fast ends or the mute clears.
- **P3.5** Add a top-level response listener in
  [app/_layout.tsx](app/_layout.tsx), guarded by `useStoreHydrated`:
  ```ts
  useEffect(() => {
    if (!hydrated) return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const action = response.actionIdentifier;
      const data = response.notification.request.content.data as { kind?: string; hours?: number };
      if (data.kind !== 'fasting-milestone') return;
      if (action === ACTION_PAUSE) {
        useAppStore.getState().pauseRemindersForCurrentFast();
      } else if (action === ACTION_SNOOZE && typeof data.hours === 'number') {
        void snoozeMilestone(data.hours);
      }
    });
    return () => sub.remove();
  }, [hydrated]);
  ```
- **P3.6** Settings: add a small status line under the reminders row when
  `mutedFastStartedAt === activeFast?.startedAt`:
  - Eyebrow `"PAUSED THIS FAST"` (in `palette.outline`).
  - Body: `"Reminders resume on your next fast — or tap to clear now."`
  - Tap → calls a new `clearReminderMute()` store action and triggers a
    re-reconcile.
- **P3.7** Tests:
  - `milestones.test.ts`: `snoozedFireAt(t)` ≈ `t + 3600000`. The
    snoozed-id helper round-trips.
  - `useAppStore.fasting.test.ts`: `pauseRemindersForCurrentFast()` sets
    `mutedFastStartedAt` to the current `activeFast.startedAt`;
    `endFast()` clears it; `startFast()` clears it; `replayOnboarding()`
    does NOT touch it (intentional — mute is per-fast, replay is
    per-onboarding).

### Verification

- New tests pass. `~10` new cases.
- Manual on-device:
  - Start a 12h fast, wait for 12h notification, tap Snooze → it
    re-fires 1h later.
  - Start a 12h fast, wait, tap Pause → 16h and 20h never fire.
  - Pause status chip appears in Settings.

### Files touched

- Edit: `src/features/notifications/milestones.ts` + test
- Edit: `src/features/notifications/scheduler.ts`
- Edit: `src/features/notifications/orchestrate.ts`
- Edit: `src/store/useAppStore.ts` + test
- Edit: `src/store/persistCoercion.ts` (default the new field)
- Edit: `src/store/persistSliceTypes.ts` (extend persisted slice)
- Edit: `app/_layout.tsx` (response listener)
- Edit: `app/(tabs)/settings.tsx` (paused-status row)

### Commit

`feat(notifications): snooze + pause actions on milestone banners`

---

## Phase 4 — Streak goals + monthly insights

**Value:** Insights currently shows a 7-day view and a streak count, but
there's no goal to chase. Add a settable streak target and a monthly
summary card so users see meaningful longer-term progress.

**Cost:** medium-high. Several pure-function additions + UI work + tests.

### Tasks

- **P4.1** Store: extend `AppSlice` with
  ```ts
  streakTargetDays: number | null;        // null = no goal set
  ```
  Default `null` on first install; default `7` after the user picks one.
  Add `setStreakTargetDays(days: number | null)` action. Add to
  `partialize`. Persist-coerce: default to `null` for older payloads.
- **P4.2** Extend `src/features/insights/computeInsights.ts`:
  ```ts
  export interface MonthlySummary {
    monthLabel: string;       // "May 2026"
    totalFasts: number;
    totalFastedMs: number;
    longestMs: number;
    averageDurationMs: number;
    fastsPerDay: number[];    // 28..31 entries, oldest first
  }
  export function monthlySummary(
    sessions: readonly FastSession[],
    now: Date,
  ): MonthlySummary;
  ```
  And a streak-progress helper:
  ```ts
  export function streakProgress(
    currentDays: number,
    targetDays: number | null,
  ): { ratio: number; remaining: number };
  ```
- **P4.3** Extend `computeInsights()` to include the monthly summary and
  the streak-progress object in `InsightsSnapshot`.
- **P4.4** UI: in [app/(tabs)/insights.tsx](app/(tabs)/insights.tsx), add
  two new sections inside the existing ScrollView:
  - **Streak goal card** (below the current streak hero): a horizontal
    pill row with chips for 7 / 14 / 30 days. Selected chip gets the
    primary accent; tapping sets `streakTargetDays`. If a target is set
    AND streak > 0, render a progress bar (`palette.primaryContainer`
    track, `palette.primary` fill) and the "X days to go" subtitle.
  - **Monthly summary card** (new SectionLabel "THIS MONTH"): four small
    KPI tiles (total fasts, total hours, longest, average), plus a
    horizontal mini-heatmap of `fastsPerDay` (one bar per day, height
    proportional to count). Reuses the existing weekly-bar component if
    extractable; otherwise inline.
- **P4.5** Tests in `src/features/insights/computeInsights.test.ts`
  (already exists from R5 work — check first):
  - `monthlySummary` counts only fasts whose endedAt lands inside the
    current calendar month (local time).
  - `monthlySummary({}, now)` returns zeros with `fastsPerDay` of the
    correct length.
  - `streakProgress(5, 7).ratio` ≈ 0.71.
  - `streakProgress(10, 7).ratio` clamps to 1; `remaining` is 0.
  - `streakProgress(3, null).ratio` is 0 (no target).

### Verification

- New tests pass. `~6–8` new cases.
- `npx tsc --noEmit` clean.
- Manual: Insights tab shows both new cards; tapping a streak chip
  immediately persists; restart preserves the selection.

### Files touched

- Edit: `src/store/useAppStore.ts` + test
- Edit: `src/store/persistCoercion.ts`
- Edit: `src/store/persistSliceTypes.ts`
- Edit: `src/features/insights/computeInsights.ts` + test (new or
  existing)
- Edit: `app/(tabs)/insights.tsx`

### Commit

`feat(insights): streak goal + monthly summary card`

---

## Phase 5 — Enriched meal cards with real photography

**Value:** the current eat-suggestions are short bullet lists with phase-
aware vector icons. Real users want concrete meal ideas with names,
ingredients, food types, and visuals. This phase swaps the data shape
and the rendering to match.

**Cost:** high — data generation + photo curation + bundle-size discipline
+ UI rebuild. Probably the biggest single phase of the round.

### Strategy: option C (dev-time AI gen, runtime stays offline)

Three options were considered:

| Option | When the LLM runs | Photo source | Privacy | Bundle cost |
|--------|-------------------|--------------|---------|-------------|
| A | Never (hand-curated) | Manual | Best | +200–500 KB |
| B | Per request (Gemini API in-app) | Generated URLs | Worst — network call, API key in client | Lowest |
| C | Dev-time only (Gemini in a script) | CC0 stock | Best (still offline at runtime) | +200–500 KB |

**Going with C.** Keeps the v1.0.6 "privacy-first, no network calls"
promise. Uses Gemini's free tier in a *dev script* to bootstrap a curated
JSON dataset that gets committed. Photos are sourced separately from
public-domain sites (Unsplash CC0, Pexels) and committed alongside.

Future-flexible: if we later want runtime variety, option B can be added
behind a Settings toggle without touching the curated baseline.

### Tasks

- **P5.1** Extend the `EatSuggestion` shape in
  [src/domain/types.ts](src/domain/types.ts):
  ```ts
  export type FoodCategory = 'protein' | 'vegetable' | 'fruit' | 'grain' | 'fat' | 'dairy' | 'drink' | 'other';

  export interface EatSuggestion {
    id: string;
    phase: EatPhase;
    title: string;          // e.g. "Greek yogurt + berries"
    bullets: string[];      // unchanged — short rationale
    dietIncludes?: DietPreferenceId[];
    dietExcludes?: DietPreferenceId[];
    /** ≥4 ingredients, ≤8. Human-readable. */
    ingredients?: string[];
    /** Food groups represented. */
    foodTypes?: FoodCategory[];
    /** Prep time in minutes, including assembly. */
    prepMinutes?: number;
    /** Reference to an asset under `assets/meals/`. WebP at 800×533. */
    photoAsset?: string;
    /** Image attribution for the credits screen (Unsplash photographer + slug). */
    photoCredit?: { author: string; sourceUrl: string };
  }
  ```
  All new fields are optional so existing entries don't need to be
  rewritten; the renderer falls back to bullets-only when fields are
  missing.
- **P5.2** Author `scripts/generate-meal-presets.mjs`:
  - Reads `GEMINI_API_KEY` from env (user supplies once at dev time).
  - For each diet (omnivore, vegan, vegetarian, pescatarian, meat_forward)
    × each phase (break_fast, light_meal, full_meal), generates 5–6 meal
    objects.
  - Schema-constrained prompt — uses Gemini's response_mime_type=application/json
    with a JSON schema enforcing the EatSuggestion shape.
  - Merges into a new `assets/data/meal-presets.json` keyed by id.
    Reuses existing ids (`e-d*`, `e-b*`, …) so old entries override
    cleanly; new ids use `m-<diet>-<seq>`.
  - Idempotent: runs the diff and only writes if content changed.
- **P5.3** Photo sourcing — manual, one-time:
  - Create `assets/meals/`.
  - For each new meal (about 25–30 total across diets), download a
    CC0 photo from Unsplash or Pexels at ≥1200×800, resize to 800×533
    WebP, quality 75, target ≤30 KB per image (so total bundle
    impact ≤900 KB).
  - Use `scripts/build-meal-thumbnails.mjs` (new) — a small `pngjs` /
    `sharp` (or just `npx svgexport`-style) image-resizer if needed.
    Document the photo source + author in `photoCredit`.
  - Place attributions in `assets/data/meal-presets.json` and surface on
    a new "Credits" row in Settings.
- **P5.4** Replace `assets/data/eat-suggestions.json` with the merged
  output of P5.2. Verify
  [src/features/eat/selectSuggestions.ts](src/features/eat/selectSuggestions.ts)
  still consumes the file the same way — `pickEatSuggestions(...)` already
  reads `bullets`, `dietIncludes`, etc., so the new optional fields ride
  along.
- **P5.5** Rebuild the eat-suggestion card in
  [app/(tabs)/index.tsx](app/(tabs)/index.tsx) (around line 105 where
  `pickEatSuggestions` is consumed). New layout when `photoAsset` and
  `ingredients` are set:
  - Top half: `<Image source={require(...)}>` at ratio 3:2.
  - Bottom half: title + tags (one chip per `foodTypes` entry) + the
    first two ingredients with a `+ N more` chip linking to a modal
    that shows full ingredients + bullets + photo credit.
  - When `photoAsset` is missing, fall back to today's vector-icon look.
- **P5.6** Add a Credits row under Settings → DANGER ZONE (or a new
  "ABOUT" section) listing photographer attributions per Unsplash /
  Pexels licensing requirements.
- **P5.7** Tests in `src/features/eat/selectSuggestions.test.ts`:
  - Verify the selector still picks `n` entries when called with the
    enriched dataset (no regressions).
  - Verify entries without `photoAsset` still pass diet filtering.

### Verification

- Bundle-size diff measured: <1.5 MB increase (JS bundle + photos
  combined). `cd TRASH/bundle-check-r6 && ls -la assets/meals` should
  show ≤30 entries ≤30 KB each.
- `npx tsc --noEmit` clean, `npm test` green.
- Manual on-device: meal cards now show photo + name + ingredient
  preview + tags. Tapping opens the full sheet.

### Files touched

- Edit: `src/domain/types.ts`
- New: `scripts/generate-meal-presets.mjs`
- New (maybe): `scripts/build-meal-thumbnails.mjs`
- New: `assets/meals/*.webp` (~25–30 files)
- Edit: `assets/data/eat-suggestions.json` (or rename to
  `meal-presets.json`)
- Edit: `src/features/eat/selectSuggestions.ts` + test
- Edit: `app/(tabs)/index.tsx`
- Edit: `app/(tabs)/settings.tsx` (credits row)

### Commit

`feat(eat): real-photo meal cards with ingredients and food tags`

(Big commit. If it lands, splitting into 5a [shape + selector + tests],
5b [data + photos], 5c [UI + credits] is fine.)

### Fallback if Gemini API isn't available

Option C requires a `GEMINI_API_KEY`. If the user doesn't want to provision
one, the same plan works with hand-curated content — skip P5.2, write the
JSON manually with ~15 entries instead of 30, sourcing from
[Wikipedia](https://en.wikipedia.org/wiki/List_of_breakfast_foods) /
domain knowledge. Photo + UI work is unchanged.

---

## Phase 6 — Version bump, build, push

### Tasks

- **P6.1** `npm run bump:patch` — bumps 1.0.7 → 1.0.8 (versionCode 10007
  → 10008).
- **P6.2** `npx expo prebuild --platform android` to fold in any
  notification-category manifest entries from Phase 3.
- **P6.3** `cd android && ./gradlew assembleDebug`. Expected:
  `BUILD SUCCESSFUL`, APK at
  `android/app/build/outputs/apk/debug/app-debug.apk` (~145 MB after
  Phase 5 photos).
- **P6.4** Bundle smoke test — confirm new strings ship:
  ```bash
  mkdir -p TRASH/bundle-check-r6
  cd TRASH/bundle-check-r6
  "$JAVA_HOME/bin/jar" xf ../../android/app/build/outputs/apk/debug/app-debug.apk assets/index.android.bundle
  grep -c "Snooze 1h" assets/index.android.bundle
  grep -c "PAUSED THIS FAST" assets/index.android.bundle
  grep -c "THIS MONTH" assets/index.android.bundle
  grep -c "Streak Goal" assets/index.android.bundle
  ```
  All should return ≥1. Update `TRASH-FILES.md`.
- **P6.5** `git push origin main`.

### Commit

`chore: v1.0.8 — bump version`

---

## Explicitly out of scope (with reasoning)

| Item | Why deferred |
|------|--------------|
| On-device testing of all phases | User chose to test after the round is complete (same as R5). |
| iOS notification action testing | Android only this round; iOS uses a different category API surface and untested by us. |
| Real-time Gemini integration (option B) | Conflicts with privacy-first stance. Option C captures the AI value at dev time. |
| Signed release AAB / Play Store assets | Still blocked by Windows long-path on `assembleRelease`. EAS or a non-Windows host required. |
| Privacy policy | Required only for store submission. |
| Notification large icon (full color image) | Standard Android UX uses the monochrome small icon for system tray; a large icon needs more design + bundle space. |
| Export CSV | Tabled to a later round; needs file-system permission flow. |

---

## Phase order and gates

Strict top-to-bottom. After each phase:

```pwsh
npx tsc --noEmit
npm test
```

If either fails, fix before moving on. The single APK rebuild happens in
Phase 6.

| Phase | Risk | Phase result if skipped |
|-------|------|-------------------------|
| 1 — cleanups | very low | small papercuts persist; no functional impact |
| 2 — onboarding tests | low (infra-only) | onboarding stays uncovered, but no regression risk |
| 3 — snooze actions | medium | feature missing; v1.0.7 unchanged |
| 4 — streak goals + monthly | medium | Insights stays at 7-day view |
| 5 — meal cards | high (content + UI surface) | meals stay text-only |
| 6 — ship | trivial | v1.0.7 remains the latest pushed |

If time pressure forces a shorter round, drop Phase 5 first (then 4, then
3 — keeping 1 + 2 always feasible).

## Commit map

| Phase | Commit message |
|-------|----------------|
| 1 | `chore: clean up R5 papercuts (unused import, system-ui wiring, RN warning note)` |
| 2 | `test(onboarding): add component-level tests under jsdom` |
| 3 | `feat(notifications): snooze + pause actions on milestone banners` |
| 4 | `feat(insights): streak goal + monthly summary card` |
| 5 | `feat(eat): real-photo meal cards with ingredients and food tags` |
| 6 | `chore: v1.0.8 — bump version` |

Push once at the end. No force-push, no rebase — clean linear history.

---

## Key files reference

| Purpose | Path |
|---------|------|
| App entry / route guard | [app/_layout.tsx](app/_layout.tsx) |
| Tab layout | [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx) |
| Home (Fast tab) — meal cards | [app/(tabs)/index.tsx](app/(tabs)/index.tsx) |
| Insights — streak + monthly target | [app/(tabs)/insights.tsx](app/(tabs)/insights.tsx) |
| Settings — paused chip + credits | [app/(tabs)/settings.tsx](app/(tabs)/settings.tsx) |
| Notification milestones (pure) | [src/features/notifications/milestones.ts](src/features/notifications/milestones.ts) |
| Notification scheduler | [src/features/notifications/scheduler.ts](src/features/notifications/scheduler.ts) |
| Notification orchestrator | [src/features/notifications/orchestrate.ts](src/features/notifications/orchestrate.ts) |
| Insights derivations | [src/features/insights/computeInsights.ts](src/features/insights/computeInsights.ts) |
| Eat suggestion selector | [src/features/eat/selectSuggestions.ts](src/features/eat/selectSuggestions.ts) |
| Eat suggestion data | [assets/data/eat-suggestions.json](assets/data/eat-suggestions.json) |
| Zustand store | [src/store/useAppStore.ts](src/store/useAppStore.ts) |
| Persist coercion | [src/store/persistCoercion.ts](src/store/persistCoercion.ts) |
| Persist slice types | [src/store/persistSliceTypes.ts](src/store/persistSliceTypes.ts) |
| Domain types | [src/domain/types.ts](src/domain/types.ts) |
| Vitest config | [vitest.config.ts](vitest.config.ts) |
| Bump script | [scripts/bump-version.mjs](scripts/bump-version.mjs) |
| Notification icon source | [assets/source/notification-icon.svg](assets/source/notification-icon.svg) |
| Notification icon raster | [assets/notification-icon.png](assets/notification-icon.png) |
| Notification icon builder | [scripts/build-notification-icon.mjs](scripts/build-notification-icon.mjs) |
| Standalone APK plugin | [plugins/withStandaloneDebugApk.js](plugins/withStandaloneDebugApk.js) |
| Stitch design source | `design-import/v7/` and `design-import/v8/` |

---

## After this round (v1.0.9+ / v1.1.0)

- iOS notification permission flow (foreground & action button parity).
- Streak / monthly export as CSV or share-sheet image.
- Notification "Resume" action when paused (currently only Pause stops it).
- Custom notification sounds via app.json sounds array.
- Wide-screen / tablet layout pass.
- Signed release AAB on a non-Windows host (or EAS Build) → Play Store
  internal testing track + privacy policy hosting.
- Material You dynamic-color theming on Android 12+ (read system tint,
  blend into `palette.primary`).
- Notification "Resume" + Reminder Settings panel (granular control over
  which milestones fire).
- Onboarding A/B variant: 4 steps vs. 2 steps, measure completion.
