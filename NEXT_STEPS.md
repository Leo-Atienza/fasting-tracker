# Fasting Tracker — Next Steps Plan

> Continuation of `FIX_PLAN.md` (now landed via commits `ddf7a71`, `ce3fd0d`, `81c1d0c`, `0776d53`). This document captures **everything still owed** to call the app "bug-free and shippable".
>
> Same conventions: small commits per wave, verification gate (`npx tsc --noEmit` + `npx vitest run`) between waves, never `rm` — `mv` to `TRASH/`. New: any new test files live next to source as `*.test.ts` (vitest only).

## Status going into this plan

- TypeScript strict mode: clean.
- Vitest: 5 files / 23 tests passing.
- Pure-logic helpers (`time.ts`, `units.ts`, `hash.ts`, `fastLimits.ts`, `persistCoercion.ts`) have tests.
- **Untested:** every screen component, every store action, every selector, the FloatingTabBar, the fast-stage selector, the water presets ordering, every persist-migration code path.
- Real-device APK behavior **has not yet been re-verified** against the Wave 1–4 changes. That is the gate before any of this work begins.

---

## Wave 5 — Confirm Wave 1–4 actually fixed the APK (BLOCKER)

**Goal:** verify on a real device that the splash chain unblocks, edge-to-edge looks correct, and unit conversion is exact. Do not start Wave 6 until this is signed off.

### Tasks

**W5.1 — Build & cold-launch.**
- Rebuild APK from the current `main`.
- Install on the phone. Cold-launch from a fresh install must reach onboarding within ~3 s. No black-splash hang.
- If it still hangs, fall through: check `adb logcat` for the first JS exception, and for `react-native-screens` / `react-native-safe-area-context` autolinking warnings. The `Themed.tsx` removal can't have caused it (it was unused), but a stale native build may need `npx expo prebuild --clean` or an EAS rebuild from scratch.

**W5.2 — Manual screen sweep.**
- Onboarding header is not clipped; "Skip" tap target works.
- Onboarding diet selection persists across app kill/reopen.
- Settings back button not clipped; status-bar icons readable in light + dark.
- Water tab: 12 oz custom pour → exactly `355 ml` in today's log (canonical conversion test).
- Settings: type `1000` in ml, toggle to oz, value should round to `34` (not snap back to saved goal).
- Facts: "Other facts" card count matches `FACTS.length - cognition_facts`.

**W5.3 — Crash-log capture.**
- The main repo already has `debug-844992.log`, `debug-a4aac4.log`, `capture-crash.ps1`. Wire `capture-crash.ps1` into an EAS post-install or document the manual capture flow in `README.md`.

### Done criteria
- Phone reaches home/onboarding reliably. No status-bar clipping. Unit math correct. No new crash logs.

---

## Wave 6 — Persistence safety net

**Goal:** Zustand persist/AsyncStorage stack already has `safePersistStorage` and `persistCoercion`, but they are **untested under real failure modes**. Persist is also the most common source of "the app worked yesterday and now won't open" bugs.

### Tasks

**W6.1 — Test `safePersistStorage` against corrupt JSON.**
- `src/storage/safePersistStorage.ts` — write `safePersistStorage.test.ts`:
  - getItem returns null on missing key.
  - getItem on invalid JSON in the underlying store recovers (no throw, write-error reported via `persistWriteErrors`).
  - setItem failure surfaces through `persistWriteErrors`.
- Mock AsyncStorage with an in-memory `Map`.

**W6.2 — Test `persistCoercion` migration paths.**
- Existing `persistCoercion.test.ts` exists — audit for gaps: what happens when `state.version` is `undefined`? When `waterEntries` is missing? When `dietPreferenceId` is a string not in the union? When `waterUnit` is neither `'ml'` nor `'oz'`?
- Add a property-style test: pass 20 hand-rolled "weird" persisted shapes through the coercer; assert the resulting state always satisfies the runtime invariants `selectWaterTodayMl` and `getFastingStage` depend on.

**W6.3 — Persist-version bump rehearsal.**
- `src/storage/persistVersion.ts` — exercise the migrate function in a test by writing v0 / v1 fixtures and confirming the migration produces a valid v2 (or whatever current is). Lock the migration code so it can't be changed without an accompanying test.

**W6.4 — `PersistErrorBanner` integration.**
- Visually confirm the banner appears when a forced write error fires (use a dev-only "fault inject" button if needed). Currently nobody has actually seen the banner.

### Done criteria
- New test file `src/storage/safePersistStorage.test.ts`.
- Coercion tests cover all union fields.
- Test count moves from 23 → ~35.

---

## Wave 7 — Fasting timer correctness

**Goal:** the timer is the core feature and the most likely place for subtle bugs (clock changes, DST, app-in-background, timezone shifts on travel).

### Tasks

**W7.1 — Wall-clock independence.**
- `app/(tabs)/index.tsx` recomputes elapsed via `now - Date.parse(activeFast.startedAt)` on a 1 s interval. If the user changes the device time backwards, elapsed goes negative; if forwards, it jumps. Decide: **(a)** clamp negative to 0 and keep the bug benign, or **(b)** also stamp a monotonic anchor and use whichever-is-larger. Write a test for whichever is chosen.

**W7.2 — Cross-midnight fasts.**
- `dayKeyForIso` is used to group water entries by day. A fast started at 23:30 yesterday and ending today should not move water entries between days when viewed mid-fast. Add a test of `selectWaterTodayMl` that asserts only same-`dayKey` entries are summed.

**W7.3 — Target overrun.**
- When `targetDurationMinutes` is exceeded, `ringProgress` clamps to 1 but the timer keeps counting. Add a regression test that elapsed > target leaves `ringProgress === 1` and elapsed continues to advance. Confirm the UI doesn't display a misleading "0% remaining".

**W7.4 — End-fast clock drift.**
- `endFast()` should stamp `endedAt: new Date().toISOString()`. Verify it stores ISO with timezone information; if it's stripping the TZ, the next session displays the wrong duration when viewed in a different timezone. Test.

**W7.5 — Background app behavior.**
- Document (in `APP_OVERVIEW.md`) that the elapsed counter does NOT keep running while the JS thread is suspended in the background — it recalculates on resume. Confirm `useEffect`'s `setInterval` doesn't leak across remounts.

### Done criteria
- New `useAppStore.fasting.test.ts` with timing edge cases.
- `getFastingStage` covered for boundary minute values (0, 59, 60, 23:59, 24:00).
- Verified manually that the timer is correct after a 30-min device-sleep.

---

## Wave 8 — Hydration correctness

**Goal:** water tracker has the same "day boundary" and "unit conversion" hazards as fasting, plus its own log mutation paths.

### Tasks

**W8.1 — Round-trip unit conversion test.**
- Add a parameterized test: for every `oz` in `[1, 8, 12, 16, 20, 32, 64]`, `mlToOz(ozToMl(x))` is within ±0.05 of `x`. For every `ml` in `[100, 250, 355, 500, 750, 1000, 2000]`, `ozToMl(Math.round(mlToOz(x)))` is within `Math.round(x * 0.034)` of `x` (since `mlToOz` truncates to one decimal before rounding).

**W8.2 — Day-boundary regression test.**
- Hand-roll a `WaterLogEntry[]` with entries at `23:59:59` yesterday and `00:00:01` today; assert `filteredToday()` returns only the latter.

**W8.3 — Edit-mode delete.**
- The trash icon in the water log calls `removeWater(entry.id)`. Add a store test that removing an entry preserves all OTHER entries. (Easy to break if the action ever switches from `filter` to a mutating `splice`.)

**W8.4 — Preset ordering invariant.**
- `presetsByPrimaryThenRest()` is used for both the quick-add row and the log-label lookup. Test that primary preset IDs come first in returned order, and that all preset IDs are unique.

### Done criteria
- Conversion round-trip + day-boundary + remove-entry tests added.
- Test count ≥ 40.

---

## Wave 9 — Accessibility & contrast pass

**Goal:** every interactive element has a label; every text color passes WCAG AA against its background.

### Tasks

**W9.1 — accessibilityLabel audit.**
- Grep every `<Pressable`, `<ScalePressable`, `<TouchableOpacity` for missing `accessibilityLabel` or `accessibilityRole`. Patch each.
- Specifically: the bookmark toggle on the Facts hero, the FAB shuffle, the bento cards (decorative — fine), the segmented unit picker.

**W9.2 — Color contrast check.**
- `FastCoachPalette.light.outline` on `surfaceContainerLowest` background: measure ratio. If under 4.5:1 for body text uses, escalate to `onSurfaceVariant`.
- Repeat for dark theme.
- One-pass tool: load each screen in dark/light and screenshot; run through `colour-contrast-checker` (web tool) or `expo-screen-contrast` if available. Document violations.

**W9.3 — Reduce-motion / reduce-transparency.**
- `ScalePressable` and the `CircularRing` ignore `AccessibilityInfo.isReduceMotionEnabled`. Either honor it (disable scale on press, freeze ring at the elapsed value) or document the choice.

**W9.4 — Font scaling.**
- Open Settings → Display → Font Size → max. Cold-launch and verify no text gets clipped. Common offenders: `pctHuge` on the water ring, `ringClock` on the fast home, the bento stats.

### Done criteria
- 100% of pressable elements have labels (verified by grep).
- Dark + light contrast issues catalogued in a `docs/accessibility.md` (or fixed inline).
- Manual font-scale screenshot diff captured.

---

## Wave 10 — Error boundaries & crash reporting

**Goal:** the user sees something useful when the app crashes, and the developer can find out why.

### Tasks

**W10.1 — Audit `app/error.tsx`.**
- Exported via `export { ErrorBoundary } from './error';` in `_layout.tsx`. Read the file; confirm it actually catches `useFonts` rejection, AsyncStorage corruption, and React render errors.
- Test by force-throwing in a component (dev only); confirm the boundary renders.

**W10.2 — Sentry (or alternative).**
- The repo already has `debug-*.log` files at the project root; that's manual capture only. Add a minimal Sentry SDK (`@sentry/react-native`) or equivalent.
- Configure DSN via `app.json` extra → read in `_layout.tsx`. Keep events disabled in dev.
- Verify `Sentry.captureException(fontError)` is called inside the watchdog before `throw`.

**W10.3 — Lockdown logging.**
- Strip every stray `console.log` from the codebase (grep first; expect to find several in the design-import folder, which is fine — leave those).
- Add a `__DEV__`-gated `log()` helper in `src/lib/log.ts` if structured dev logging is wanted.

### Done criteria
- ErrorBoundary tested.
- Crashes reach a server.
- `console.log` count in app code = 0.

---

## Wave 11 — Dead-code cleanup round 2

**Goal:** the remaining template / unused / inert code from `create-expo-app` and the Wave-2 changes.

### Tasks

**W11.1 — `Colors` in `(tabs)/_layout.tsx`.**
- The custom `FloatingTabBar` is wired via `tabBar={...}`, which means `screenOptions.tabBarActiveTintColor` / `tabBarInactiveTintColor` are dead. Either remove them (and remove the `Colors` import) or remove the custom tab bar and rely on `Colors`. Pick one — but pick.
- If `Colors` becomes orphan, move `constants/Colors.ts` to `TRASH/`.

**W11.2 — Unused `Pressable` import in `app/settings.tsx`.**
- Imported, never used. Remove.

**W11.3 — `components/useColorScheme.ts` / `.web.ts`.**
- Verify both branches are needed (web target vs native). The web variant is hardcoded to `'light'`. Either:
  - (a) Keep, document why.
  - (b) Drop, since the app is mobile-only — `app.json` still declares `web` but nobody is shipping the web build.

**W11.4 — Asset directory audit.**
- `assets/` likely has unused images from the Expo template (`adaptive-icon.png`, `favicon.png`, etc.). Audit which are referenced from `app.json` and which aren't. Move unreferenced to `TRASH/`.

**W11.5 — `eas.json` review.**
- Confirm production/preview profiles align with how APKs are actually built. If profiles aren't used, drop them.

### Done criteria
- No dead imports.
- `Colors` is either fully used or fully gone.
- Repo file count noticeably smaller.

---

## Wave 12 — Native + release polish

**Goal:** ship-quality APK with proper icons, permissions, splash assets, and store readiness.

### Tasks

**W12.1 — App icon + splash.**
- `app.json` references default Expo icons. Replace with FastCoach-branded artwork. Generate adaptive icon for Android, monochrome icon for Material You.
- Splash should match the dark/light system; configure both via `expo-splash-screen` config plugin.

**W12.2 — Permissions audit.**
- Check `AndroidManifest` generated by EAS. Strip any permissions the app doesn't use (especially `INTERNET` if no remote calls; though Expo bundles likely need it).

**W12.3 — Bundle size.**
- `expo doctor --bundle-size` (or equivalent) — current APK is uninspected. Top offenders likely: vector icons, fonts. Consider tree-shaking `@expo/vector-icons` to only the icon sets actually imported.

**W12.4 — Privacy / data-handling claim.**
- The app stores diet, water log, fast log, favorite facts — all locally. Decide whether to advertise "no data leaves your device" in the Play Store listing.

**W12.5 — Version + build numbers.**
- `package.json` is at `1.0.0`. Bump on every shipped APK. Add a `bump-version` npm script or use `eas build:version:set`.

### Done criteria
- Icons replaced, splash on-brand.
- No unused permissions.
- Bundle size reported and acceptable.

---

## Wave 13 — Branch & worktree hygiene

**Goal:** clean up sibling worktrees / branches left over from the multi-session work.

### Tasks

**W13.1 — Delete merged feature branch.**
- After this plan's owning branch merges, run `git branch -d claude/<this>` and `git worktree remove .claude/worktrees/<this>`.

**W13.2 — Sibling worktree `claude/quirky-clarke-8eee75`.**
- Same SHA as main pre-merge; contains only the `FIX_PLAN.md` scratchpad. Decide: archive `FIX_PLAN.md` somewhere (e.g. `docs/history/2026-05-FIX_PLAN.md`) or discard. Then `git worktree remove` and `git branch -d`.

**W13.3 — Orphan branch `claude/suspicious-lehmann-da9801`.**
- Lives on commit `22cdb57 Initial commit` — **unrelated history** to main. Inspect the worktree; if it's not actively in use, `git worktree remove` and `git branch -D` (capital D because it's not merged).
- Do not merge it into main without a clear reason.

### Done criteria
- Only `main` and live feature branches exist locally.
- `git worktree list` shows only intentional worktrees.

---

## Final acceptance for "bug-free"

- All test counts climb past 50 with the new persist / fasting / hydration suites in place.
- Manual real-device sweep clean after each release-candidate build.
- ErrorBoundary verified by a forced-throw test.
- Crash reporter (Sentry-like) receives a test exception.
- `expo doctor` / `npx expo install --check` clean.
- TypeScript strict, zero warnings.
- Bundle size measured and documented in `APP_OVERVIEW.md`.
- A single Play Store-ready APK from `main` cold-launches in <3 s with no manual coaxing.

## Out of scope for this whole plan
- Switching state libraries, navigation, or design system.
- Adding multi-user / cloud sync (would be a separate epic).
- Migrating `ScalePressable` off the legacy `Animated` API.
- Localization beyond English.
