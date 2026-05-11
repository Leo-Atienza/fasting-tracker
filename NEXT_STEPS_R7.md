# Fasting Tracker — Round-7 Plan (v1.0.9 finish)

> Continuation of [NEXT_STEPS_R6.md](NEXT_STEPS_R6.md). v1.0.8 shipped the
> R5 papercut cleanups, an onboarding state-machine extraction, notification
> snooze + pause actions, the streak-goal chip and monthly-summary card on
> Insights, and 25 hand-curated meal presets with ingredients, food tags,
> prep minutes, and a per-preset medical evidence note.
>
> Round 7 closes the loop on three deferred concerns (real-device UAT,
> URL backfill for medical sources, Resume notification action), adds a
> dedicated Reminders settings panel with per-milestone toggles, and does
> a wide-screen layout pass. Optional sound work at the end.
>
> Conventions remain: one coherent commit per phase, verification gate
> (`npx tsc --noEmit && npm test`) between phases, never `rm` — `mv` to
> `TRASH/` (which is gitignored). Every store action ships with a unit
> test in the same commit. App stays Android-only; iOS deferred.

---

## State at the start of this round

True as of the last `main` push (commit `47c4838`):

- **Branch:** `main`, in sync with `origin/main`. Working tree clean.
- **Version:** v1.0.8 (versionCode 10008). Bump script: `npm run bump:patch`
  keeps `package.json` / `app.json` / `android/app/build.gradle` in lockstep.
- **TypeScript:** strict, clean (`npx tsc --noEmit`).
- **Tests:** Vitest, 17 files / 201 tests passing. Config in
  [vitest.config.ts](vitest.config.ts) — `include: ['src/**/*.test.ts']`,
  `environment: 'node'`. Still node-only (R6 deviated from the jsdom path).
- **APK:** [android/app/build/outputs/apk/debug/app-debug.apk](android/app/build/outputs/apk/debug/app-debug.apk),
  ~143 MB, JS bundle 2.33 MB (was 2.29 MB pre-R6; +43 KB from meal preset
  content).
- **Platform scope:** Android only. iOS + web remain deferred.
- **Persisted slice** (post-R6 fields):
  `hasCompletedOnboarding`, `dietPreferenceId`, `defaultFastTargetMinutes`,
  `eatShuffleNonce`, `activeFast`, `sessions`, `waterEntries`,
  `waterDailyGoalMl`, `waterUnit`, `favoriteFactIds`,
  `fastingRemindersEnabled`, `mutedFastStartedAt`, `streakTargetDays`,
  `premiumDismissed`. No schema-version bump this round unless we add new
  required fields.
- **Notable R6 carry-overs (unverified on-device):**
  - Snooze 1h / Pause notification action buttons (P3) — not OS-confirmed.
  - "PAUSED THIS FAST" chip in Settings (P3) — not OS-confirmed.
  - SystemUI background tracking on dark/light flip (P1) — not OS-confirmed.
  - Streak goal chip persistence across app restart (P4) — not OS-confirmed.
  - Monthly summary card with real session data (P4) — not OS-confirmed.
  - Meal detail sheet modal on phone (P5) — not OS-confirmed.
- **Medical sources** in `eat-suggestions.json`: 25 entries with
  `medicalNote.source` populated, 22 unique source strings, **zero**
  `sourceUrl` fields populated. This is the primary R7 content gap.
- **Sources currently bundled** (the URL backfill targets):
  ```
  AHA Dietary Recommendation for Fish (2018 update)
  AHA Scientific Statement on Seafood (Circulation 2018)
  AHA Scientific Statement on glycemic index (Circulation 2002)
  Academy of Nutrition and Dietetics Position Paper on Vegetarian Diets (J Acad Nutr Diet 2016)
  Academy of Nutrition and Dietetics — Plant-Based Diets
  Academy of Nutrition and Dietetics — general refeeding guidance
  Cleveland Clinic / NIH NIDDK general nutrition guidance
  EFSA 2015 caffeine safety opinion
  FAO/WHO/UNU Expert Consultation on Protein Quality
  FDA / EPA Advice About Eating Fish (2021)
  FDA 21 CFR 101.81 (whole-oat health claim)
  NASEM 2005 (Dietary Reference Intakes for Water)
  NASEM Dietary Reference Intakes — Protein
  NIH NIA — Calorie Restriction and Fasting Diets
  NIH Office of Dietary Supplements — Iron Fact Sheet
  PREDIMED — NEJM 2013/2018
  Sonnenburg lab, Stanford (Cell 2021)
  USDA Dietary Guidelines 2020–2025
  USDA Food Safety guidance
  USDA FoodData Central
  USDA FoodData Central + AHA dietary fiber guidance
  USDA FoodData Central — Quinoa, cooked
  ```
- **Gotchas to remember:**
  - `android/` is gitignored — every prebuild output reapplies the
    [standalone APK plugin](plugins/withStandaloneDebugApk.js) automatically.
  - `assembleRelease` is blocked on Windows by the long-path limit
    (ninja.exe is not long-path-aware); we still ship `assembleDebug`
    with the bundle embedded.
  - `expo prebuild` (without `--clean`) preserves manifest edits IF the
    underlying input (app.json) drives them. Manual manifest edits are
    overwritten by prebuild — anything we want kept must live in app.json.
  - The Bash tool's CWD does not persist across calls. Always use absolute
    paths or chain commands in a single shell with `&&`.
  - The `cctools-safety-hooks` Bash hook blocks `git add -A`, `git add .`,
    `git add *`, and bare `rm`. Use explicit file paths and `mv` to TRASH.

---

## Phase 0 — Sideload v1.0.8 + UAT capture

**Value:** Six R6 features shipped without on-device verification. Catching
issues now means they get fixed in Phase 1 before more code piles on top.

**Cost:** very low (no code) — about 20-30 minutes of structured device
testing. Output is a punch list, not a commit.

### Tasks

- **P0.1** Sideload the v1.0.8 debug APK:
  ```pwsh
  adb install -r android/app/build/outputs/apk/debug/app-debug.apk
  ```
  Confirm "Fasting Tracker 1.0.8" in the app's Settings footer.

- **P0.2** Walk through the **R6 P1 visual checks**:
  - [ ] Open Settings → flip system dark/light mode → status bar and nav
        bar background tracks `palette.background` smoothly (no neutral
        flash). This is the expo-system-ui wiring.
  - [ ] Pull up the navigation back-gesture from the (tabs) layout — the
        revealed surface behind the tab bar should match the palette, not
        be the default Android system white/black.

- **P0.3** **R6 P3 notification action UAT**. The 12 h milestone is the
  fastest reachable target on a real device. To accelerate testing
  without waiting 12 hours, **temporarily** lower one milestone in a
  scratch branch:
  ```ts
  // milestones.ts — TEMPORARY (revert before committing P1)
  { hours: 0.05, title: '3 min in — test.', body: 'Test milestone.' },
  ```
  Rebuild (`assembleDebug`), sideload, then:
  - [ ] Start a fast → wait ~3 minutes → confirm the OS banner shows
        **Snooze 1h** and **Pause** buttons below the body text.
  - [ ] Tap **Snooze 1h** → confirm a second banner fires ~1 hour later
        (or, if you can't wait, instrument
        `scheduler.snoozeMilestone(_, _, tappedAt - 3600_000 + 60_000)`
        to fire in 1 minute for the test).
  - [ ] Tap **Pause** → open the app → confirm Settings now shows the
        **PAUSED THIS FAST** chip directly below the Fasting Reminders
        toggle.
  - [ ] Tap the chip → confirm it disappears immediately and that the
        orchestrator reschedules (you can confirm via
        `Notifications.getAllScheduledNotificationsAsync()` in a debug
        log).
  - [ ] End the fast → start a new one → confirm reminders re-arm
        (mute is per-fast, not sticky).

  After UAT, **revert** the temporary milestone change in the scratch
  branch (do not merge it).

- **P0.4** **R6 P4 streak + monthly UAT**:
  - [ ] Complete a couple of short fasts (1 min targets, force-end them
        with `useAppStore.getState().endFast()`) so you have ≥2 sessions
        with today's date.
  - [ ] Open Insights → tap each of 7-DAY / 14-DAY / 30-DAY chips →
        confirm the selected chip turns to the primary color, the rest
        revert to neutral, and the streak progress bar appears only when
        `streakDays > 0`.
  - [ ] Force-quit the app → re-open → confirm the chip selection
        persists.
  - [ ] Scroll to "THIS MONTH" → confirm the month label matches your
        local calendar (e.g. "May 2026"), and that the mini-heatmap shows
        a bar on today's index.

- **P0.5** **R6 P5 meal preset UAT**:
  - [ ] On the Fast tab, with no active fast, scroll to "Ideas Between
        Fasts" — confirm cards show food-type tags + prep-minute badge
        (not the old "380 KCAL" placeholder).
  - [ ] Tap a meal card with ingredients (e.g. Greek yogurt with berries).
        Detail sheet should slide up showing:
    - Title, food-type pills, prep-time pill
    - INGREDIENTS section with name + amount per line
    - NOTES section with the original bullets
    - EVIDENCE NOTE card (left-bordered, secondary color)
    - Close button + backdrop-tap dismiss
  - [ ] Try a small phone (≤6" screen) to confirm the sheet doesn't
        overflow the safe area — `maxHeight: '85%'` should keep it bounded.
  - [ ] Change diet in Settings → return to Fast tab → confirm the meal
        pool shifts (omnivore → vegan should swap salmon for tofu, etc.).

- **P0.6** **General regression checks** (10 min spot check):
  - [ ] Onboarding flow still completes (state-machine refactor).
  - [ ] History list still renders sessions correctly.
  - [ ] Water log still records entries.
  - [ ] Notification icon in the system tray still shows the white hourglass.

- **P0.7** Capture every issue (visual glitches, broken interactions,
  unexpected behaviors, layout overflow, contrast problems, etc.) in a
  scratch file `TRASH/r7-uat-findings.md`. Format each finding as:
  ```
  ### [severity P1/P2/P3] Short title
  - **Where:** screen + element
  - **Repro:** numbered steps
  - **Expected:** what should happen
  - **Actual:** what does happen
  - **Hypothesis:** suspected root cause (optional)
  ```
  TRASH is gitignored — the file is for your own driving of Phase 1.

### Verification

This phase has no automated gate. Output is the punch list
(`TRASH/r7-uat-findings.md`) that drives Phase 1's scope.

### Files touched

None (manual testing only).

### Commit

None — Phase 0 is pre-flight, not committed work.

---

## Phase 1 — UAT bug fixes + small papercuts

**Value:** address Phase 0 findings before building more on top.

**Cost:** variable. Plan for 1–3 small commits. If Phase 0 finds zero
P1/P2 issues, skip directly to Phase 2 and note "Phase 1 empty — no UAT
findings" in DEV_NOTES.

### Known candidate issues to watch for (hypotheticals, not facts)

- **C1 — Modal backdrop dismiss on Android.** RN `<Modal>` with a
  `Pressable` backdrop sometimes intercepts events strangely. If the
  meal detail sheet doesn't dismiss on backdrop tap, replace
  `onPress={onClose}` on the outer Pressable with
  `onStartShouldSetResponder={() => true}` + `onResponderRelease`, or
  switch to `react-native-modal`-style portal pattern.
- **C2 — Dark mode sheet contrast.** `#1B1D20` hardcoded background in
  `MealDetailSheet` may not match `palette.surfaceContainerHigh`. Replace
  with `palette.surfaceContainerHigh` (light) / `palette.surfaceContainerHighest`
  (dark) — already in the palette.
- **C3 — Monthly heatmap with 0 fasts.** Bars all min-height look like
  "the data is there but empty" — could add a label saying "No fasts
  this month yet" overlay when `totalFasts === 0`.
- **C4 — Streak chip de-select edge case.** Tapping the currently-selected
  streak chip clears the target. Confirm this is intentional UX (it's
  documented in the commit but might surprise users). If surprising, add
  a confirmation dialog.
- **C5 — System-UI flicker on cold start.** `SystemUI.setBackgroundColorAsync`
  may run before the JS scheme is decided. If there's a one-frame flash,
  gate the call behind `useStoreHydrated` like the orchestrator already is.
- **C6 — Notification action buttons not rendering on older Android.**
  `setNotificationCategoryAsync` may behave differently on Android 11
  vs. 14. If buttons don't appear, check
  [the expo-notifications Android quirks doc](https://docs.expo.dev/versions/latest/sdk/notifications/).

### Tasks

- **P1.1** Triage `TRASH/r7-uat-findings.md` — assign each to P1 (must
  fix this round) / P2 (fix if cheap) / P3 (file for later).
- **P1.2** Fix every P1 finding. Each fix gets:
  - A targeted commit (one logical fix per commit, or batched if they
    touch the same file).
  - A unit test when the bug is reproducible in pure logic.
  - A line in DEV_NOTES if the fix has non-obvious reasoning.
- **P1.3** Defer P2/P3 to the "After this round" section at the bottom of
  this plan, with a one-line description each.
- **P1.4** Verify the full UAT script (P0.2 – P0.6) passes after fixes.

### Verification

- `npx tsc --noEmit` clean.
- `npm test` — 201+ tests passing (Phase 1 should only add tests, not
  reduce them).
- The Phase 0 UAT script re-run shows no P1 issues.

### Files touched

Variable — depends on findings.

### Commit message template

`fix(<scope>): <short description of the fix>`

Examples:
- `fix(eat): sheet backdrop dismiss on Android Modal`
- `fix(insights): empty-month heatmap label`
- `fix(theme): SystemUI race on cold start`

---

## Phase 2 — Medical-fact URL backfill + Credits screen

**Value:** Phase 5 of R6 shipped 22 unique evidence sources by name only.
This phase adds canonical URLs so users can verify any claim, plus a
single Settings → ABOUT → Credits row that aggregates every source with
a tap-to-open link. Closes the R6 sourcing caveat documented in
[DEV_NOTES.md](DEV_NOTES.md).

**Cost:** medium. Real research time (~30–60 minutes to find each URL)
plus modest UI work for the credits screen.

### URL backfill targets

Resolve each of the 22 unique sources to a canonical URL. Spend ≤5 minutes
per source — if no canonical URL exists, leave `sourceUrl` undefined and
note that in the diff message. Suggested target URLs:

| Source string | Suggested target |
|---|---|
| NASEM 2005 (Dietary Reference Intakes for Water) | `https://nap.nationalacademies.org/catalog/10925` |
| NASEM Dietary Reference Intakes — Protein | `https://nap.nationalacademies.org/catalog/10490` |
| NIH NIA — Calorie Restriction and Fasting Diets | `https://www.nia.nih.gov/health/diet-and-nutrition/calorie-restriction-and-fasting-diets-what-do-we-know` |
| NIH Office of Dietary Supplements — Iron Fact Sheet | `https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/` |
| USDA Dietary Guidelines 2020–2025 | `https://www.dietaryguidelines.gov/` |
| USDA FoodData Central (any) | `https://fdc.nal.usda.gov/` |
| USDA Food Safety guidance | `https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation` |
| EFSA 2015 caffeine safety opinion | `https://www.efsa.europa.eu/en/efsajournal/pub/4102` |
| AHA Scientific Statement on Seafood (Circulation 2018) | `https://www.ahajournals.org/doi/10.1161/CIR.0000000000000574` |
| AHA Dietary Recommendation for Fish (2018 update) | same Circulation 2018 statement |
| AHA Scientific Statement on glycemic index (Circulation 2002) | `https://www.ahajournals.org/doi/10.1161/01.CIR.0000038493.65177.94` |
| FDA 21 CFR 101.81 | `https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-E/section-101.81` |
| FDA / EPA Advice About Eating Fish (2021) | `https://www.fda.gov/food/consumers/advice-about-eating-fish` |
| FAO/WHO/UNU Expert Consultation on Protein Quality | `https://www.fao.org/3/aa040e/aa040e00.htm` |
| Academy of Nutrition and Dietetics Position Paper on Vegetarian Diets | `https://www.jandonline.org/article/S2212-2672(16)31192-3/fulltext` |
| Academy of Nutrition and Dietetics — Plant-Based Diets | `https://www.eatright.org/health/wellness/vegetarian-and-special-diets/building-a-healthy-vegetarian-diet-myths-vs-facts` |
| Academy of Nutrition and Dietetics — general refeeding guidance | (no canonical URL — keep blank) |
| Cleveland Clinic / NIH NIDDK general nutrition guidance | `https://www.niddk.nih.gov/health-information/diet-nutrition` |
| PREDIMED — NEJM 2013/2018 | `https://www.nejm.org/doi/full/10.1056/NEJMoa1800389` |
| Sonnenburg lab, Stanford (Cell 2021) | `https://www.cell.com/cell/fulltext/S0092-8674(21)00754-6` |

These are suggestions, not requirements — verify each one resolves before
committing. If WebSearch/WebFetch is still flaky, run them locally in a
browser and paste the URL into the JSON.

### Tasks

- **P2.1** For every entry in `assets/data/eat-suggestions.json` with a
  `medicalNote`, add a `sourceUrl` field. Skip entries where no canonical
  URL is found (leave `sourceUrl` undefined; the renderer already handles
  the absent case).
- **P2.2** Bundle-size budget: the URL strings add ~80 chars × 22 entries
  ≈ +2 KB to the JS bundle. Confirm.
- **P2.3** New aggregation helper
  `src/features/eat/aggregateSources.ts`:
  ```ts
  export interface CreditSourceEntry {
    source: string;
    sourceUrl?: string;
    usedIn: number; // # of meal presets that cite this source
  }
  export function aggregateMedicalSources(
    suggestions: readonly EatSuggestion[],
  ): CreditSourceEntry[];
  ```
  Returns sources sorted alphabetically. Deduplicates by `source`.
- **P2.4** Add tests in `src/features/eat/aggregateSources.test.ts`:
  - Empty input returns `[]`.
  - Duplicate sources are counted once with `usedIn` reflecting both.
  - Entries without `medicalNote` are skipped.
  - The current `eat-suggestions.json` has between 18 and 22 unique
    sources (sanity bounds, future-proofs against typos).
- **P2.5** New screen `app/credits.tsx`:
  - Uses `FixedTopBar` with title "Sources & credits" and a back arrow
    (or close button) that returns to Settings.
  - `ScrollView` of source cards. Each card:
    - Source title (palette.onSurface, body font)
    - Subtle "used in X meal presets" caption (palette.outline, label font)
    - Optional "Open source ↗" link (Pressable → `Linking.openURL(sourceUrl)`)
      shown only when `sourceUrl` is present.
  - Add a footer block reminding users that all notes are educational
    only.
- **P2.6** Settings → new "ABOUT" `SectionLabel` below "DANGER ZONE" (or
  above it — match the visual hierarchy). One row inside the section:
  - Icon: `book-open-variant`
  - Title: "Sources & credits"
  - Sub: "{N} medical references used in meal presets" where N comes from
    `aggregateMedicalSources(rawData).length`.
  - Tap → `router.push('/credits')`.
- **P2.7** Verify the new `credits.tsx` is wired into expo-router's file
  tree — it lives under `app/` (alongside `onboarding.tsx`), not under
  `app/(tabs)/`, so it gets a stack push instead of a tab swap.
  Update `app/_layout.tsx` if needed to give it `headerShown: false` and
  match the rest of the navigation chrome.

### Verification

- `npx tsc --noEmit` clean.
- `npm test` — ≥4 new aggregation cases pass.
- Sideload check: tap "Sources & credits" in Settings → screen lists 18-22
  unique sources with working tap-to-open URLs.

### Files touched

- Edit: `assets/data/eat-suggestions.json` (22 entries get a new field)
- New: `src/features/eat/aggregateSources.ts` + `aggregateSources.test.ts`
- New: `app/credits.tsx`
- Edit: `app/(tabs)/settings.tsx` (new About section)
- Edit: `app/_layout.tsx` (register the credits route)
- Edit: `DEV_NOTES.md` (close out the R6 sourcing caveat)

### Commit

`feat(credits): canonical URLs for every medical source + Settings → Credits screen`

If the URL backfill itself takes >1h of research, split into 2a
(backfill JSON only) and 2b (aggregator + Credits screen + Settings row).

---

## Phase 3 — Notification Resume action + per-milestone toggles

**Value:** R6 P3 added Pause but no easy way to come back. Per-milestone
toggles give users granular control — silence only the 20 h nudge if it
arrives too late at night, keep the 12 and 16 h.

**Cost:** medium-high. Two related but separable subfeatures.

### 3a — Per-milestone enable toggles

- **P3.1** Store: add `enabledMilestones: number[]` to `AppSlice`. Default
  `[12, 16, 20]` (all on). New action
  `setMilestoneEnabled(hours: number, enabled: boolean)` that adds/removes
  the hour from the array, deduplicated and sorted. Persist-coerce
  defaults missing arrays to `[12, 16, 20]`.
- **P3.2** `src/features/notifications/milestones.ts`: extend the existing
  `milestonesToScheduleFrom(startedAtIso, now)` with an optional
  third arg `enabledHours: readonly number[] = MILESTONES.map(m => m.hours)`.
  Filter the planned set against `enabledHours`. Default keeps current
  behavior.
- **P3.3** `scheduler.scheduleFastingMilestones` accepts an optional
  `enabledHours` param and forwards it to `milestonesToScheduleFrom`.
- **P3.4** `orchestrate.ts`: include `enabledMilestones` in the slice
  selector and pass to `scheduleFastingMilestones`. Reschedule on
  `enabledMilestones` change while a fast is active.
- **P3.5** Tests in `milestones.test.ts`:
  - Empty `enabledHours` → empty planned set.
  - Partial enabled (`[16]`) → only the 16 h milestone scheduled.
  - All-enabled default behavior preserved (regression guard).
- **P3.6** Tests in `useAppStore.fasting.test.ts`:
  - `setMilestoneEnabled(12, false)` removes 12 from the array.
  - `setMilestoneEnabled(12, true)` re-adds it; idempotent if already on.
  - Defaults to `[12, 16, 20]` on a fresh store.
  - `clearAllData` resets to defaults.

### 3b — Resume notification action

Goal: when the user taps Pause on a banner, post a single low-importance
ongoing notification titled "Reminders paused" with a Resume action
button. Tapping Resume clears the mute and dismisses the ongoing
notification. The orchestrator already reschedules when the mute clears.

- **P3.7** Add to `milestones.ts`:
  ```ts
  export const ACTION_RESUME = 'resume';
  export const PAUSED_REMINDER_ID = 'fasting-pause-reminder';
  ```
- **P3.8** Extend `setupNotificationHandler`'s category registration to
  include a second category `NOTIF_CATEGORY_PAUSED` with only the
  `ACTION_RESUME` button. (Or reuse `NOTIF_CATEGORY` with all three
  buttons and let context filter — simpler.)
- **P3.9** New `scheduler.postPausedReminder()` — schedules a single
  immediate notification with id `PAUSED_REMINDER_ID`, title "Reminders
  paused", body "Tap to resume notifications for this fast.",
  `categoryIdentifier` for the resume category, low Android importance,
  `sticky: true` on Android so the user can't accidentally swipe it away.
- **P3.10** New `scheduler.dismissPausedReminder()` — cancels
  `PAUSED_REMINDER_ID`.
- **P3.11** Orchestrator: on `justMuted` → call `postPausedReminder`. On
  un-mute (`wasMuted && !isMuted`) → call `dismissPausedReminder`. On
  `endFast` → also dismiss (defensive).
- **P3.12** `_layout.tsx` response listener: handle
  `action === ACTION_RESUME` → `useAppStore.getState().clearReminderMute()`.
- **P3.13** Reword the Settings paused chip body to "Reminders resume on
  your next fast — or pull down notifications and tap Resume." to
  explain the OS-level affordance.

### 3c — Settings reorganization

The PREFERENCES section in Settings is getting crowded. Extract the
reminders UI into its own card so per-milestone toggles fit cleanly.

- **P3.14** Move the existing "Fasting Reminders" row + permission chip +
  paused chip into a new component `src/components/SettingsRemindersCard.tsx`
  (or keep inline — judgment call based on file length).
- **P3.15** Below the master toggle, add a collapsible "Choose your
  milestones" sub-section with three `IOSToggle` rows:
  - 12 h — "First milestone"
  - 16 h — "Classic 16:8"
  - 20 h — "Long-window"
  Disabled visually when master toggle is off.
- **P3.16** Update the existing onboarding step 4 copy if you want to
  expose per-milestone selection there too. Otherwise leave onboarding
  as the master-only opt-in.

### Verification

- `npx tsc --noEmit` clean.
- `npm test` — ~10 new cases (6 milestones + 4 store).
- Sideload UAT:
  - [ ] Toggle 16 h off → start a 17 h fast → only 12 h and 20 h fire.
  - [ ] Tap Pause → confirm the ongoing "Reminders paused" notification
        appears and the in-app Settings chip both show.
  - [ ] Pull down the notification → tap Resume → confirm the ongoing
        notification dismisses, the chip clears, and milestones reschedule.

### Files touched

- Edit: `src/features/notifications/milestones.ts` + test
- Edit: `src/features/notifications/scheduler.ts`
- Edit: `src/features/notifications/orchestrate.ts`
- Edit: `src/store/useAppStore.ts` + test
- Edit: `src/store/persistCoercion.ts`
- Edit: `src/store/persistSliceTypes.ts`
- Edit: `app/_layout.tsx` (response listener for Resume)
- Edit: `app/(tabs)/settings.tsx` (reminders card reorg)
- Maybe new: `src/components/SettingsRemindersCard.tsx`

### Commit

`feat(notifications): Resume action + per-milestone enable toggles`

---

## Phase 4 — Wide-screen / tablet layout pass

**Value:** the app's current layout was phone-first and never tested on
a tablet. Make sure nothing breaks on ≥600 dp width: the Bento grid
should use the extra horizontal space, sheets should cap their width,
the ring should grow proportionally.

**Cost:** medium. No new features, but every screen touches it.

### Tasks

- **P4.1** New hook `src/hooks/useBreakpoint.ts`:
  ```ts
  export type Breakpoint = 'phone' | 'tablet' | 'large';
  export function useBreakpoint(): Breakpoint;
  ```
  - `phone` = `< 600` dp width
  - `tablet` = `600–900` dp width
  - `large` = `> 900` dp width
  Uses `useWindowDimensions()` from RN. Re-renders on rotation.
- **P4.2** Home screen (`app/(tabs)/index.tsx`):
  - Bento grid `minWidth: '31%'` on tablet (3 cols), `47%` on phone.
  - Ring size scales: `phone: 264`, `tablet: 320`, `large: 360`.
  - Goal-length chip row stays horizontal on tablet — already scrollable.
- **P4.3** Insights screen (`app/(tabs)/insights.tsx`):
  - Tile row stays 3-across on tablet.
  - Monthly heatmap bars wider on tablet (auto via flex, but verify).
  - Charts taller on tablet (`height: 140` vs. `100`).
- **P4.4** Settings (`app/(tabs)/settings.tsx`):
  - Constrain content `maxWidth: 720` with `alignSelf: 'center'` on
    tablet so the cards don't stretch comically wide.
- **P4.5** History (`app/(tabs)/history.tsx`):
  - Same `maxWidth: 720` content cap.
- **P4.6** Meal detail sheet (`MealDetailSheet` in home screen):
  - `maxWidth: 600`, `alignSelf: 'center'` so it doesn't span the full
    tablet width — keeps the sheet readable.
- **P4.7** Onboarding (`app/onboarding.tsx`):
  - Already gracefully scrolls. Cap content `maxWidth: 560` on tablet.
- **P4.8** Manual UAT: launch an Android tablet emulator (Pixel C profile,
  Android 14, 600 dp+ width). Walk through every screen.

### Verification

- `npx tsc --noEmit` clean.
- `npm test` — no new tests required (this is pure layout). Optional: a
  pure-logic test for `useBreakpoint()` boundary behavior.
- Tablet emulator UAT: no overflowing content, no awkward white space,
  no broken touch targets.

### Files touched

- New: `src/hooks/useBreakpoint.ts` (+ optional test)
- Edit: `app/(tabs)/index.tsx`
- Edit: `app/(tabs)/insights.tsx`
- Edit: `app/(tabs)/settings.tsx`
- Edit: `app/(tabs)/history.tsx`
- Edit: `app/onboarding.tsx`

### Commit

`feat(layout): wide-screen / tablet adaptive sizing`

---

## Phase 5 — Notification custom sound (optional)

**Value:** The current notification handler sets `sound: false` and
relies on the OS default. Some users may want a deliberate, calm tone
distinct from system notifications. Easy win when bundle size allows.

**Cost:** low. One asset, three config edits, one option in Settings.

### Decision gate

Skip this phase if Phase 0 UAT confirmed silent banners feel right to
you. The default Android notification sound is already fine. Move
straight to Phase 6.

### Tasks (if proceeding)

- **P5.1** Source or compose a short, calm WAV (~0.5–1.0 s, ≤30 KB):
  - License: CC0 or self-recorded.
  - Frequency-soft (e.g., a gentle marimba tap).
  - Place at `assets/sounds/calm.wav`.
- **P5.2** `app.json`:
  ```json
  {
    "expo": {
      "plugins": [
        ["expo-notifications", { "sounds": ["./assets/sounds/calm.wav"] }]
      ]
    }
  }
  ```
- **P5.3** Run `expo prebuild --platform android` so the sound resource
  lands under `android/app/src/main/res/raw/`.
- **P5.4** `scheduler.scheduleFastingMilestones`: change
  `sound: false` to `sound: 'calm.wav'`. Wrap in try/catch since the
  resource might be missing on web.
- **P5.5** Optional Settings toggle "Use calm tone" — defaults to off so
  existing users aren't surprised. Persist as `useCustomNotificationSound: boolean`.
- **P5.6** Bundle-size sanity: confirm APK didn't grow by more than the
  WAV file size (×3 for Android density multipliers — usually only
  `raw/` though, no density variants).

### Verification

- Sideload + start a fast → wait for milestone → confirm the calm tone
  plays (not the system default).
- Verify silence path: toggle the Settings option off → next milestone
  is silent again.

### Files touched

- New: `assets/sounds/calm.wav`
- Edit: `app.json`
- Edit: `src/features/notifications/scheduler.ts`
- Edit: `app/(tabs)/settings.tsx` (optional toggle)
- Edit: `src/store/useAppStore.ts` (optional toggle field)

### Commit

`feat(notifications): bundled calm tone with opt-in Settings toggle`

---

## Phase 6 — v1.0.9 bump + build + push

### Tasks

- **P6.1** `npm run bump:patch` — bumps 1.0.8 → 1.0.9 (versionCode
  10008 → 10009).
- **P6.2** `npx expo prebuild --platform android` ONLY if Phase 5 added
  the sound asset. Otherwise skip — Phase 2/3/4 are pure JS changes.
- **P6.3** `cd android && ./gradlew assembleDebug`. Expected:
  `BUILD SUCCESSFUL` in roughly the same time as R6 (~1m 45s).
  APK still around 143–145 MB.
- **P6.4** Bundle smoke test — confirm new strings ship:
  ```bash
  PROJ=/c/Users/leooa/Documents/personal-projects/fasting-tracker
  mkdir -p $PROJ/TRASH/bundle-check-r7
  cd $PROJ/TRASH/bundle-check-r7
  "$JAVA_HOME/bin/jar" xf $PROJ/android/app/build/outputs/apk/debug/app-debug.apk assets/index.android.bundle
  # Phase 2:
  grep -c "Sources & credits" assets/index.android.bundle
  grep -c "https://" assets/index.android.bundle
  # Phase 3:
  grep -c "Reminders paused" assets/index.android.bundle
  grep -c "First milestone" assets/index.android.bundle
  grep -c "Classic 16:8" assets/index.android.bundle
  # Phase 4:
  # (no new strings — visual only)
  # Phase 5 (if shipped):
  grep -c "calm.wav" assets/index.android.bundle
  ```
  All counts should be ≥1 (≥10 for `https://` if Phase 2 backfilled
  most URLs).
- **P6.5** `git push origin main`.

### Commit

`chore: v1.0.9 — bump version`

---

## Explicitly out of scope (with reasoning)

| Item | Why deferred |
|------|--------------|
| Signed release AAB / Play Store assets | Still blocked by Windows long-path on `assembleRelease`. EAS or a non-Windows host required. Track in DEV_NOTES. |
| Material You dynamic-color theming | Android 12+ only, needs a system-tint reader + palette blend pass. Substantial design work; saving for v1.1.0. |
| iOS notification action parity | iOS uses `setNotificationCategoryAsync` with slightly different option semantics (`.foreground` vs. `.opensAppToForeground`). Untested by us this round. |
| CSV / share-sheet export of streaks | Needs file-system or share-sheet permission flow. Separate phase candidate for v1.1.0. |
| Meal preset search / filter UI | Larger UI lift than the current shuffle button. Defer until users ask. |
| User-added meal presets | Persistent meal authoring is a feature surface of its own (form, validation, storage). Out of scope for v1.0.9. |
| Onboarding A/B variant (2-step vs. 4-step) | Needs instrumentation; we don't have analytics wired. Defer. |
| Visual / mounting tests for screens (jsdom + RTNL) | R6 deviated to pure-logic state-machine tests. Revisit only if a screen-level bug class emerges that pure tests can't catch. |
| Privacy policy hosting | Required only for store submission. Pair with the AAB work. |
| Notification large icon (full color) | Standard Android UX uses the monochrome small icon. A large icon adds bundle size and design work; pair with Material You. |

---

## Phase order and gates

Strict top-to-bottom. After each non-zero-code phase:

```pwsh
npx tsc --noEmit
npm test
```

If either fails, fix before moving on. The single APK rebuild happens in
Phase 6.

| Phase | Risk | Phase result if skipped |
|-------|------|-------------------------|
| 0 — UAT capture | none (manual) | R6 ships without on-device verification; bugs leak into R7 |
| 1 — UAT bug fixes | low (small fixes) | Whatever Phase 0 found stays unfixed |
| 2 — URL backfill + Credits | medium | Medical facts stay institution-name-only; users can't follow up |
| 3 — Resume + per-milestone | medium-high | No way to resume from OS; coarse-grained reminders only |
| 4 — Tablet layout | medium | App stays phone-only-looking on tablets |
| 5 — Custom sound | low (optional) | Default OS sound remains |
| 6 — Ship | trivial | v1.0.8 stays the latest pushed |

If time pressure forces a shorter round, drop Phase 5 first (it's
optional), then Phase 4 (cosmetic on phones), then Phase 3b (Resume —
the in-app chip is already a workaround). Keep Phase 0, 1, 2, and 3a.

## Commit map

| Phase | Commit message |
|-------|----------------|
| 0 | (no commit — UAT only) |
| 1 | `fix(<scope>): <description>` — one per fix |
| 2 | `feat(credits): canonical URLs for every medical source + Settings → Credits screen` |
| 3 | `feat(notifications): Resume action + per-milestone enable toggles` |
| 4 | `feat(layout): wide-screen / tablet adaptive sizing` |
| 5 | `feat(notifications): bundled calm tone with opt-in Settings toggle` (optional) |
| 6 | `chore: v1.0.9 — bump version` |

Push once at the end. No force-push, no rebase — clean linear history.

---

## Key files reference

| Purpose | Path |
|---------|------|
| App entry / route guard | [app/_layout.tsx](app/_layout.tsx) |
| Tab layout | [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx) |
| Home (Fast tab) — meal cards + sheet | [app/(tabs)/index.tsx](app/(tabs)/index.tsx) |
| Insights — streak + monthly | [app/(tabs)/insights.tsx](app/(tabs)/insights.tsx) |
| Settings — preferences + chips | [app/(tabs)/settings.tsx](app/(tabs)/settings.tsx) |
| History | [app/(tabs)/history.tsx](app/(tabs)/history.tsx) |
| Onboarding | [app/onboarding.tsx](app/onboarding.tsx) |
| Credits (new) | `app/credits.tsx` (to be created in Phase 2) |
| Notification milestones (pure) | [src/features/notifications/milestones.ts](src/features/notifications/milestones.ts) |
| Notification scheduler | [src/features/notifications/scheduler.ts](src/features/notifications/scheduler.ts) |
| Notification orchestrator | [src/features/notifications/orchestrate.ts](src/features/notifications/orchestrate.ts) |
| Insights derivations | [src/features/insights/computeInsights.ts](src/features/insights/computeInsights.ts) |
| Eat suggestion selector | [src/features/eat/selectSuggestions.ts](src/features/eat/selectSuggestions.ts) |
| Eat suggestion data | [assets/data/eat-suggestions.json](assets/data/eat-suggestions.json) |
| Aggregate medical sources (new) | `src/features/eat/aggregateSources.ts` (to be created in Phase 2) |
| Onboarding state machine | [src/features/onboarding/state.ts](src/features/onboarding/state.ts) |
| Zustand store | [src/store/useAppStore.ts](src/store/useAppStore.ts) |
| Persist coercion | [src/store/persistCoercion.ts](src/store/persistCoercion.ts) |
| Persist slice types | [src/store/persistSliceTypes.ts](src/store/persistSliceTypes.ts) |
| Domain types | [src/domain/types.ts](src/domain/types.ts) |
| Vitest config | [vitest.config.ts](vitest.config.ts) |
| Bump script | [scripts/bump-version.mjs](scripts/bump-version.mjs) |
| Notification icon source | [assets/source/notification-icon.svg](assets/source/notification-icon.svg) |
| Standalone APK plugin | [plugins/withStandaloneDebugApk.js](plugins/withStandaloneDebugApk.js) |
| Dev notes | [DEV_NOTES.md](DEV_NOTES.md) |
| R6 plan (for reference) | [NEXT_STEPS_R6.md](NEXT_STEPS_R6.md) |

---

## After this round (v1.1.0 candidates)

Items that don't fit the v1.0.x patch-level cadence but should be tracked.

### High-impact

- **Signed release AAB on a non-Windows host or EAS Build.** Unblocks
  Play Store internal testing track. Pair with a privacy policy hosting
  step. Estimated 1-2 days of CI + signing key + policy work.
- **Play Store listing assets.** App icon adaptive, feature graphic
  1024×500, 4–8 screenshots, short description (80 chars), full
  description (4000 chars), categorization.
- **Material You dynamic color (Android 12+).** Read system tint via
  the React Native `DynamicColorIOS` cousin for Android (or the
  `useColorScheme` extension). Blend into `palette.primary`.
- **iOS parity pass.** Notification categories work but use a different
  options surface. Build on iOS simulator, test all R6+R7 flows.
- **CSV / share-sheet export.** "Export my history" → CSV via
  `expo-sharing` or a system share intent.

### Quality of life

- **User-customizable meal presets.** A "+ Add your meal" flow with
  fields matching the `EatSuggestion` shape, persisted locally.
- **Meal preset search / filter UI.** Text search across title and
  ingredients; filter by food category.
- **Notification large icon (color).** Pair with Material You.
- **Onboarding A/B variant.** 2-step (skip diet + reminders) vs.
  4-step. Needs analytics.
- **Wider-than-Reminders Settings reorganization.** "Goals", "Reminders",
  "Display", "Data" sub-sections for cleaner Information Architecture.

### Carry-over from R6's "after this round" list

- Notification "Resume" action — **landing in R7 P3**.
- Custom notification sounds — **landing in R7 P5 (optional)**.
- Wide-screen / tablet layout pass — **landing in R7 P4**.
- iOS notification permission flow — still deferred.
- Streak / monthly export — still deferred.
- Material You — still deferred.
- Onboarding A/B variant — still deferred.

### Tracking-only (no concrete plan yet)

- **Bundle size watch.** v1.0.8 JS bundle is 2.33 MB. If we add new
  features that push past 2.6 MB, do a tree-shake audit (Hermes config,
  unused MaterialCommunityIcons set, etc.).
- **The `MainApplication.kt` `ReactNativeHost : Any` Kotlin deprecation.**
  Already on the watchlist in DEV_NOTES. Re-check on the next RN/Expo
  upgrade — drop the watchlist entry when the template stops emitting
  the warning.
- **Persist schema version.** Still at the R5-era value. If we add a
  required (non-optional) persisted field in a future round, bump
  `APP_PERSIST_SCHEMA_VERSION` and add a migration coercion.
