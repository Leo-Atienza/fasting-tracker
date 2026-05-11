# Fasting Tracker — Round-5 Plan (v1.0.7 finish)

> Continuation of [NEXT_STEPS_R4.md](NEXT_STEPS_R4.md). v1.0.6 shipped the 4-step
> onboarding, local milestone notifications via `expo-notifications`, the
> "Fast Coach" → "Fasting Tracker" rename, and miscellaneous polish. This
> document is the punch list for v1.0.7: closing the remaining feature gaps
> and quality issues that don't require on-device verification.
>
> Conventions: one coherent commit per phase, verification gate
> (`npx tsc --noEmit && npm test`) between phases, never `rm` — `mv` to
> `TRASH/` with an entry in `TRASH-FILES.md`. Every store action ships with
> a unit test in the same commit.

---

## State at the start of this round

Anything below is true as of the last `main` push (commit `69e76ed`):

- **Branch:** `main`, in sync with `origin/main`. Working tree clean.
- **Version:** v1.0.6 (versionCode 10006). Bump script: `npm run bump:patch`
  keeps `package.json` / `app.json` / `android/app/build.gradle` in lockstep.
- **TypeScript:** strict, clean (`npx tsc --noEmit`).
- **Tests:** Vitest, 14 files / 138 tests passing. Config in
  [vitest.config.ts](vitest.config.ts) — **`include: ['src/**/*.test.ts']`**
  (no `.tsx`, no jsdom — pure-logic tests only).
- **APK:** [android/app/build/outputs/apk/debug/app-debug.apk](android/app/build/outputs/apk/debug/app-debug.apk),
  144 MB, JS bundle (2.2 MB) embedded, `expo-notifications` auto-linked.
- **Platform scope:** Android only. iOS + web deferred (README marks them as
  "wired but not regularly tested").
- **Out-of-scope confirmed:** device testing (will happen after this round),
  iOS, signed release AAB, Play Store assets, privacy policy.
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

## Phase 1 — Notification permission divergence

**Value:** the only real correctness bug shipped in v1.0.6. The Settings
reminders toggle stays ON even after the user revokes Android's
`POST_NOTIFICATIONS` permission externally. Silent UX failure — toggle
reads as enabled, no notifications fire.

**Cost:** low — one new hook, one Settings edit, no store schema change.

### Tasks

- **P1.1** Create `src/hooks/useNotificationPermissionStatus.ts`:
  - Exports `useNotificationPermissionStatus(): 'granted' | 'denied' | 'undetermined' | 'unsupported'`.
  - On mount, calls `Notifications.getPermissionsAsync()`. Refreshes on
    screen focus via `useFocusEffect` from `@react-navigation/native`.
  - All native calls wrapped in try/catch → returns `'unsupported'` on
    error (web / module missing).
  - Status mapping logic factored out into the pure module from Phase 2
    (`mapPermissionStatus(res)`).

- **P1.2** In [app/settings.tsx](app/settings.tsx) (currently around line
  150 — the reminders row inside the PREFERENCES card), add a conditional
  warning chip rendered *under* the toggle row when
  `remindersEnabled === true && status === 'denied'`:
  - Layout: full-width row, warning color border-left (4px),
    `alert-circle-outline` icon, two-line label:
    - Eyebrow: `"NOTIFICATIONS BLOCKED"` in `palette.error`.
    - Body: `"Reminders won't fire until you re-enable them in system settings."`
  - Tappable; `onPress = () => Linking.openSettings()` (built into
    `react-native`, no new dep).
  - `accessibilityRole="button"`, `accessibilityHint="Opens system settings."`

- **P1.3** Leave the orchestrator silent on permission denial — the visible
  signal is the Settings chip, not a toggle auto-flip. Do **not** mutate
  store state from the permission check.

### Verification

- Pure helper `mapPermissionStatus` covered in Phase 2 tests.
- `npx tsc --noEmit` clean.
- Manual on-device verification deferred.

### Files touched

- New: `src/hooks/useNotificationPermissionStatus.ts`
- Edit: `app/settings.tsx` (add chip + Linking import)

### Commit

`fix(notifications): surface OS-permission divergence in Settings`

---

## Phase 2 — Pure-logic tests for new notifications code

**Value:** v1.0.6 shipped `src/features/notifications/scheduler.ts` and
`orchestrate.ts` with zero coverage. The native bridge is untestable in
vitest (no jsdom + expo-modules-core needs the native host), but the
*decisions* the module makes — which milestones to schedule, how to map
permission status — are pure functions we can extract.

**Cost:** low — one new pure module, one test file, minor refactor of
`scheduler.ts` to consume the helpers.

### Tasks

- **P2.1** Create `src/features/notifications/milestones.ts` containing:
  ```ts
  export const MILESTONES: { hours: number; title: string; body: string }[] = [...]
  export const MILESTONE_ID_PREFIX = 'fasting-milestone-';
  export function makeMilestoneId(hours: number): string;
  export function isMilestoneIdentifier(id: string): boolean;
  /** Filters milestones to those firing > 5s in the future from `now`. */
  export function milestonesToScheduleFrom(
    startedAtIso: string,
    now: number,
  ): { hours: number; fireAt: Date; id: string; title: string; body: string }[];
  export function mapPermissionStatus(
    raw: { granted?: boolean; canAskAgain?: boolean } | null | undefined,
  ): 'granted' | 'denied' | 'undetermined' | 'unsupported';
  ```
  Move the `MILESTONES` array and ID helpers out of `scheduler.ts`. The
  scheduler imports from `milestones.ts`.

- **P2.2** Create `src/features/notifications/milestones.test.ts` with:
  - `milestonesToScheduleFrom` returns 3 entries when called at `t=0` for
    a fast that started 1s ago.
  - Returns 2 entries when fast started 13 h ago (12h milestone has
    passed but 16h and 20h are future).
  - Returns 0 entries when fast started 21 h ago (all three are past).
  - Returns 0 entries for invalid ISO input (`'not-a-date'`).
  - `makeMilestoneId(16)` and `isMilestoneIdentifier(makeMilestoneId(16))`
    round-trip cleanly. `isMilestoneIdentifier('foo')` is `false`.
  - `mapPermissionStatus({ granted: true })` → `'granted'`.
  - `mapPermissionStatus({ granted: false, canAskAgain: true })` →
    `'undetermined'`.
  - `mapPermissionStatus({ granted: false, canAskAgain: false })` →
    `'denied'`.
  - `mapPermissionStatus(null)` and `mapPermissionStatus(undefined)` →
    `'unsupported'`.

- **P2.3** Refactor `src/features/notifications/scheduler.ts` to use the
  pure helpers — replace the inlined `MILESTONES` array, the inlined
  id helpers, and the future-filter logic. Behavior unchanged.

### Why no tests for `scheduler.ts` / `orchestrate.ts`

Both files are thin glue layers over a native module. Mocking
`expo-notifications` is doable but brittle — the bug surface lives in the
pure decisions, which we now cover. Component tests for `app/onboarding.tsx`
also skipped: vitest config is `*.test.ts` (no `.tsx`), and adding jsdom +
react-native-web is real infra work for marginal gain on a state machine
that's simple enough to read.

### Verification

- New tests pass: ~8 cases, all sub-millisecond.
- `scheduler.ts` still typechecks against `expo-notifications` types.

### Files touched

- New: `src/features/notifications/milestones.ts`
- New: `src/features/notifications/milestones.test.ts`
- Edit: `src/features/notifications/scheduler.ts` (extract helpers)

### Commit

`test(notifications): pure-logic coverage for milestone scheduling`

---

## Phase 3 — Replay-onboarding entry point in Settings

**Value:** right now the only way back into onboarding is **Clear all data**
(in the DANGER ZONE), which wipes history, water log, favorites, AND
preferences. Users who want to retune just the defaults shouldn't lose
their fast log to do it.

**Cost:** trivial — one store action, one Settings row.

### Tasks

- **P3.1** In [src/store/useAppStore.ts](src/store/useAppStore.ts):
  - Add to `AppActions` interface: `replayOnboarding: () => void;`
  - Implementation: `replayOnboarding: () => set({ hasCompletedOnboarding: false }),`
  - Do **not** clear any other fields. The onboarding screen already
    seeds its local state from current store values (see
    `app/onboarding.tsx` ~line 66), so the user sees their current choices
    preselected.

- **P3.2** In [app/settings.tsx](app/settings.tsx), inside the PREFERENCES
  GlassCard, add a third row (after Fasting Reminders, before the closing
  card tag). Visual mirrors the existing diet-row pattern:
  - Icon: `restart` in `palette.primary` orb
  - Title: `"Replay setup"`
  - Subtitle: `"Re-run the 4-step welcome flow"`
  - Tap → `Alert.alert` confirmation:
    - Title: `"Replay onboarding?"`
    - Body: `"Your fast history, water log, and favorites stay intact. You'll just walk through the welcome flow again with your current choices preselected."`
    - Buttons: `[{ text: 'Cancel', style: 'cancel' }, { text: 'Replay', onPress: () => replayOnboarding() }]`
  - NavigationGuard in [app/_layout.tsx](app/_layout.tsx) handles the
    redirect to `/onboarding` because `hasCompletedOnboarding` flips
    to `false`.

- **P3.3** Add a unit test in
  [src/store/useAppStore.fasting.test.ts](src/store/useAppStore.fasting.test.ts)
  (or a new file if that one's domain-pure):
  - `replayOnboarding()` flips `hasCompletedOnboarding` to `false`.
  - It does NOT modify `sessions`, `waterEntries`, `favoriteFactIds`,
    `dietPreferenceId`, `defaultFastTargetMinutes`, `waterDailyGoalMl`,
    `fastingRemindersEnabled`, or `premiumDismissed`.

### Verification

- New store test passes.
- Manual flow (deferred): Settings → Replay setup → confirm → onboarding
  renders with prior choices preselected → Finish → land on Fast tab,
  data intact.

### Files touched

- Edit: `src/store/useAppStore.ts`
- Edit: `app/settings.tsx`
- Edit (or new): test file for the new action

### Commit

`feat(settings): replay-onboarding row preserves user data`

---

## Phase 4 — Notification icon + expo-system-ui

**Value:** two correctness fixes, both Android-specific.

**Cost:** low — one SVG to draw, one dep to install, one prebuild.

### 4a. Android notification icon

Right now Android shows a generic system icon (a square) in the notification
shade when fasting milestones fire. Material guidelines require a
white-on-transparent monochrome icon at 24dp baseline.

#### Tasks

- **P4.1** Author `assets/source/notification-icon.svg`:
  - 24×24 viewBox.
  - Single path: hourglass silhouette matching the app icon's hourglass
    motif (referenced from [assets/source/icon.svg](assets/source/icon.svg)).
  - Fill: pure white (`#FFFFFF`). No stroke. Transparent background.
  - Keep the path under 60 vertices — Android renders it as alpha mask only.

- **P4.2** Export `assets/notification-icon.png` at 96×96 (xxxhdpi
  density). Single resolution is fine; expo-notifications' config plugin
  generates other densities from it at prebuild time.

- **P4.3** Update [app.json](app.json) — add `"icon"` to the
  expo-notifications plugin config:
  ```json
  [
    "expo-notifications",
    {
      "icon": "./assets/notification-icon.png",
      "color": "#34c759",
      "defaultChannel": "fasting-milestones"
    }
  ]
  ```

- **P4.4** Run `npx expo prebuild --platform android` (no `--clean`).
  Expected effect: new drawable files under
  `android/app/src/main/res/drawable-*/notification_icon.png`, plus a
  meta-data tag in the manifest pointing at it. The standalone APK
  plugin re-applies automatically.

### 4b. expo-system-ui

#### Tasks

- **P4.5** `npx expo install expo-system-ui` — adds the module and pins
  the SDK-54-compatible version.

- **P4.6** Re-run `npx expo prebuild --platform android`. The module
  auto-links via expo-modules-autolinking — no app code changes needed.
  Effect: silences the prebuild warning
  (`» android: userInterfaceStyle: Install expo-system-ui...`) and makes
  `"userInterfaceStyle": "automatic"` drive the Android system
  background color across theme switches.

### Verification

- `npx tsc --noEmit` clean (no app code changes).
- APK builds.
- `jar tf` confirms `res/drawable-*/notification_icon.png` is bundled.
- Manual on-device verification deferred.

### Files touched

- New: `assets/source/notification-icon.svg`
- New: `assets/notification-icon.png`
- Edit: `app.json`
- Edit: `package.json` (+expo-system-ui)
- Re-prebuild output: `android/` (gitignored)

### Commit

`chore(notifications): monochrome icon + expo-system-ui module`

---

## Phase 5 — Floating tab bar on History and Settings

**Value:** the Stitch design (`design-import/v8/`) shows the floating
capsule tab bar on every primary screen including History and Settings.
Currently those are stack-routed under `app/`, so the bar disappears
when you open them — visual break from the rest of the app.

**Cost:** medium — file moves, a small FloatingTabBar refactor, and a
risk of breaking typed-routes since `typedRoutes: true` is enabled in
[app.json](app.json).

### Architecture decision

Two valid approaches:

- **A. Promote both screens into `(tabs)` with `href: null`** — they
  remain routable via `<Link href="/history">` / `<Link href="/settings">`
  but don't render a tab pill. The floating bar's selection state stays
  on the last visible tab.
- **B. Keep stack-routed; render `<FloatingTabBar>` manually on each.**

Going with **A**. It's the idiomatic expo-router pattern, the
FloatingTabBar component stays simple, and the existing
`<Link href="/history">` / `<Link href="/settings">` calls in
[FixedTopBar.tsx](src/components/fastCoach/FixedTopBar.tsx) keep working
because the route paths are unchanged.

### Tasks

- **P5.1** Move `app/history.tsx` → `app/(tabs)/history.tsx`. Update
  any relative imports inside the file (none expected — all imports are
  via the `@/` alias).

- **P5.2** Move `app/settings.tsx` → `app/(tabs)/settings.tsx`.

- **P5.3** Update [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx) to
  register both screens as hidden tabs:
  ```tsx
  <Tabs.Screen name="history" options={{ href: null }} />
  <Tabs.Screen name="settings" options={{ href: null }} />
  ```
  Existing four screens (index, water, insights, facts) stay as-is.

- **P5.4** Remove the corresponding `<Stack.Screen>` entries from
  [app/_layout.tsx](app/_layout.tsx) (currently around lines 135–136):
  ```tsx
  <Stack.Screen name="history" options={{ headerShown: false }} />
  <Stack.Screen name="settings" options={{ headerShown: false }} />
  ```
  These would conflict with the new (tabs) routing.

- **P5.5** Refactor [FloatingTabBar.tsx](src/components/fastCoach/FloatingTabBar.tsx)
  so it filters out hidden routes. React-navigation's bottom-tabs does
  this internally but we render the bar manually:
  ```tsx
  const visibleRoutes = state.routes.filter((route) => {
    const opts = descriptors[route.key]?.options ?? {};
    return opts.href !== null && opts.tabBarButton !== null;
  });
  // ...then map over visibleRoutes instead of state.routes
  ```
  Note: when the active route is `history` or `settings`, the
  `state.index` points at a hidden route — visually the bar has no
  selected tab, which matches "secondary screen" intent. Tapping a tab
  navigates to it as expected.

- **P5.6** Verify the floating tab bar doesn't overlap with the
  History/Settings scroll content. Both screens already include
  `paddingBottom: 140` (or similar) in their ScrollView/FlatList content
  containers; double-check by re-reading the styles after the move.

- **P5.7** Type check (`npx tsc --noEmit`) to catch any typed-routes
  breakage. `typedRoutes: true` regenerates `expo-env.d.ts` on next
  start, so if `/history` and `/settings` were typed as stack-only,
  the type check will complain. If so, run `npx expo customize tsconfig.json`
  or restart `npx expo start --typed-routes` to regenerate. Most likely
  no breakage — paths are unchanged.

### Verification

- `npx tsc --noEmit` clean.
- All 138+ existing tests still pass (no test references file paths).
- APK builds. Bundle should contain both screens at their new locations.

### Risk

- **Deep-link mismatch.** Anywhere in the codebase that does
  `router.push('/history')` (or settings) should continue to work
  because expo-router resolves by URL, not file path. Grep:
  ```bash
  grep -rn "router\.\(push\|replace\|navigate\)\|<Link" --include='*.tsx' app/ src/
  ```
  Audit each match; expected count: ~5 hits, all using the URL form,
  none breaking.

- **NavigationGuard.** [app/_layout.tsx:60-65](app/_layout.tsx) checks
  `segments?.[0] === 'onboarding'`. After the move, `/history` resolves
  to `segments = ['(tabs)', 'history']`, so `segments[0]` becomes
  `(tabs)`. The guard's behavior is preserved (it only redirects when
  not in onboarding, regardless of tab name).

### Files touched

- Move: `app/history.tsx` → `app/(tabs)/history.tsx`
- Move: `app/settings.tsx` → `app/(tabs)/settings.tsx`
- Edit: `app/(tabs)/_layout.tsx`
- Edit: `app/_layout.tsx`
- Edit: `src/components/fastCoach/FloatingTabBar.tsx`

### Commit

`refactor(routing): promote History and Settings into (tabs)`

---

## Phase 6 — SVG RadialGradient mesh blobs

**Value:** [ScreenBackground.tsx](src/components/fastCoach/ScreenBackground.tsx)
currently uses solid `borderRadius: 999` views with low opacity for the
corner blobs — readable but flat. The Stitch v8 design shows true radial
falloff (CSS `radial-gradient(at 0% 0%, ...)`). `react-native-svg` is
already a dependency, so this is free upgrade.

**Cost:** low — one component refactor, ~30 lines.

### Tasks

- **P6.1** Refactor `ScreenBackground.tsx`:
  - Keep the outer `LinearGradient` base (palette.background → palette.surfaceContainer).
  - Replace the two `<View>` blobs with two `<Svg>` layers, each
    absolutely positioned (top-right and bottom-left).
  - Each SVG contains:
    ```tsx
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id={`blob-${accent}-tr`} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={blobColor(palette, conf.top)} stopOpacity="1" />
          <Stop offset="1" stopColor={blobColor(palette, conf.top)} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#blob-${accent}-tr)`} />
    </Svg>
    ```
    Positioned within a parent `<View>` sized 80% width × 50% height,
    pinned to the relevant corner with negative margins so the gradient
    centers off-screen for the falloff effect.
  - Two such SVG containers per screen (top accent + bottom accent).

- **P6.2** Verify performance: each SVG layer is GPU-accelerated; two
  per screen is negligible. Confirm no animation interplay.

### Verification

- `npx tsc --noEmit` clean.
- Bundle size grows by ~1–2 KB (no new image data, just JS for SVG nodes).
- Manual visual on-device verification deferred.

### Files touched

- Edit: `src/components/fastCoach/ScreenBackground.tsx`

### Commit

`polish(bg): SVG RadialGradient mesh blobs`

---

## Phase 7 — Version bump, build, push

### Tasks

- **P7.1** `npm run bump:patch` — bumps 1.0.6 → 1.0.7 across
  `package.json`, `app.json`, `android/app/build.gradle` (versionCode
  10006 → 10007).

- **P7.2** `npx expo prebuild --platform android` to fold in any
  remaining manifest / drawable changes from Phases 4 and 5 that weren't
  yet re-prebuilt. Standalone APK plugin auto-applies.

- **P7.3** `cd android && ./gradlew assembleDebug`. Expected outcome:
  `BUILD SUCCESSFUL`, APK at
  `android/app/build/outputs/apk/debug/app-debug.apk` (~144 MB).

- **P7.4** Verify embedded JS bundle contains new strings:
  ```bash
  mkdir -p TRASH/bundle-check-r5
  cd TRASH/bundle-check-r5
  "$JAVA_HOME/bin/jar" xf ../../android/app/build/outputs/apk/debug/app-debug.apk assets/index.android.bundle
  grep -c "Replay setup" assets/index.android.bundle
  grep -c "NOTIFICATIONS BLOCKED" assets/index.android.bundle
  ```
  Both should return ≥1. Update `TRASH-FILES.md` with an entry for this
  scratch extraction.

- **P7.5** `git push origin main`. The remote is `Leo-Atienza/fasting-tracker`.

### Files touched

- Auto-edited by bump-version: `package.json`, `app.json`,
  `android/app/build.gradle` (gitignored, included via prebuild).

### Commit

`chore: v1.0.7 — bump version`

(Committed AFTER the phase-1..6 commits land. Single small commit so
the bump is easy to revert.)

---

## Explicitly out of scope (with reasoning)

| Item | Why deferred |
|------|--------------|
| On-device testing of all phases | User chose to test after the round is complete. |
| Component-level tests for onboarding flow | Vitest configured `*.test.ts` only; adding jsdom + react-native-web is meaningful infra work and the state is too simple to justify. |
| Mocked `expo-notifications` integration tests | Native bridge is the wrong surface to mock; the value lives in `milestones.ts`, which Phase 2 covers. |
| Real food photography on meal idea cards | No CC-0 source on hand; bundling ~4 JPGs adds 300–500 KB to an offline app. The v1.0.6 phase-aware vector icons stay. |
| Signed release AAB / Play Store assets | Not shipping to a store this round. |
| Privacy policy | Required only for store submission. |
| iOS / web verification | User scoped to Android. |

---

## Phase order and gates

Strict top-to-bottom. After each phase, run:

```pwsh
npx tsc --noEmit
npm test
```

If either fails, fix before moving on. The single APK rebuild happens in
Phase 7 — no need to rebuild between phases unless touching native
(Phase 4 and 5 both touch the manifest, but those bundle automatically
into the final Phase 7 build).

## Commit map

| Phase | Commit message |
|-------|----------------|
| 1 | `fix(notifications): surface OS-permission divergence in Settings` |
| 2 | `test(notifications): pure-logic coverage for milestone scheduling` |
| 3 | `feat(settings): replay-onboarding row preserves user data` |
| 4 | `chore(notifications): monochrome icon + expo-system-ui module` |
| 5 | `refactor(routing): promote History and Settings into (tabs)` |
| 6 | `polish(bg): SVG RadialGradient mesh blobs` |
| 7 | `chore: v1.0.7 — bump version` |

Push once at the end. No force-push, no rebase — clean linear history.

---

## Key files reference

| Purpose | Path |
|---------|------|
| App entry / route guard | [app/_layout.tsx](app/_layout.tsx) |
| Tab layout | [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx) |
| Home (Fast tab) | [app/(tabs)/index.tsx](app/(tabs)/index.tsx) |
| Onboarding flow | [app/onboarding.tsx](app/onboarding.tsx) |
| Settings | [app/settings.tsx](app/settings.tsx) — will move to `app/(tabs)/settings.tsx` in P5 |
| History | [app/history.tsx](app/history.tsx) — will move to `app/(tabs)/history.tsx` in P5 |
| Glass top bar + offset hook | [src/components/fastCoach/FixedTopBar.tsx](src/components/fastCoach/FixedTopBar.tsx) |
| Floating capsule tab bar | [src/components/fastCoach/FloatingTabBar.tsx](src/components/fastCoach/FloatingTabBar.tsx) |
| Per-screen mesh background | [src/components/fastCoach/ScreenBackground.tsx](src/components/fastCoach/ScreenBackground.tsx) |
| Notification scheduler | [src/features/notifications/scheduler.ts](src/features/notifications/scheduler.ts) |
| Notification orchestrator | [src/features/notifications/orchestrate.ts](src/features/notifications/orchestrate.ts) |
| Design tokens | [constants/FastCoachTheme.ts](constants/FastCoachTheme.ts) |
| Zustand store | [src/store/useAppStore.ts](src/store/useAppStore.ts) |
| Persist coercion | [src/store/persistCoercion.ts](src/store/persistCoercion.ts) |
| Standalone APK plugin | [plugins/withStandaloneDebugApk.js](plugins/withStandaloneDebugApk.js) |
| Stitch design source | `design-import/v7/` and `design-import/v8/` |

---

## After this round

Everything below stays on the wish list for a v1.0.8 / v1.1.0:

- On-device testing of v1.0.7 (Android phone: onboarding, notifications,
  history/settings inside tab bar, dark mode toggle, small-screen ring
  sizing).
- Onboarding component tests (would need jsdom + react-native-web setup).
- Mocked `expo-notifications` integration tests (low ROI).
- Real food photography for meal idea cards.
- iOS notification permission flow.
- Signed release AAB + Play Store listing.
- Privacy policy page (in-app + hosted).
- Notification snooze actions.
- Streak goals + monthly insights.
- Export fast/water history as CSV.
