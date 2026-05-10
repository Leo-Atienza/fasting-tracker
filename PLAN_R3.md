# Fast Coach — Round-3 Plan (continuation of `NEXT_STEPS.md`)

> Continuation of [NEXT_STEPS.md](NEXT_STEPS.md). Same conventions: small commits per phase, verification gate (`npx tsc --noEmit` + `npx vitest run`) between phases, never `rm` — `mv` to `TRASH/`. New rule: **one commit per coherent unit; commits are now expected (per user instruction this round)**.

## Status going into this plan

- TypeScript strict: clean.
- Vitest: 6 files / 38 tests passing (was 5/23 at start of this session).
- Fresh debug APK builds end-to-end on Windows after `LongPathsEnabled=1` registry tweak. Last successful local build: 7m46s, 137MB at `android/app/build/outputs/apk/debug/app-debug.apk`.
- New Stitch design batch 3 imported under `design-import/stitch_app_interface_design_3/` — covers all 6 screens (home, history, facts, water, onboarding, settings) plus 2 design-system specs.
- The existing `FastCoachPalette` / `FastCoachFonts` / `FastCoachRadii` / `FastCoachSpacing` already encode the design-system tokens 1:1 (verified against `fast_coach_design_system/DESIGN.md`). Visual deltas are *layout / componentry*, not theme tokens.

---

## Phase A — Lock the core invariants with tests *(no UI changes)*

### Wave 6.2 (property) — invariant test for the coercer

**Goal:** prove that whatever weird shape `coerceFromMigrateInput` is fed, the result NEVER violates the runtime invariants `selectWaterTodayMl` and `getFastingStage` rely on.

**Tasks**
- New file `src/store/persistCoercion.invariants.test.ts`.
- Hand-roll ≥20 weird inputs: `null`, `undefined`, primitives, arrays at the top, missing every field, junk in every field, `NaN`/`Infinity`, dates 100y in the past/future, water entries with `ml` of every weird shape, `activeFast` with junk timestamps, etc.
- For each, assert:
  1. `selectWaterTodayMl({ waterEntries: result.waterEntries ?? [] })` is a finite non-negative number.
  2. `getFastingStage(elapsedMs, hasActive)` for `elapsedMs ∈ {0, 5_000, 60_000, 8*3600_000, 24*3600_000, 72*3600_000}` and both booleans never throws and always returns an object with `title`, `description`, `icon` strings.
- Test guarantees: pure functions, no mocks needed.

### Wave 6.3 — persistVersion migration rehearsal

**Goal:** lock the migrate function — any future change to the migration path must come with an updated test fixture.

**Tasks**
- New file `src/storage/persistVersion.test.ts`.
- For `[v=undefined, v=0, v=1, v=current]` write a hand-rolled v0/v1 envelope through the migrate function and assert the output:
  - is a valid `Partial<PersistedSlice>`,
  - keeps the data we care about (e.g. `dietPreferenceId`),
  - drops fields that no longer exist on the current shape.
- If `persistVersion.ts` doesn't currently expose the migrate function as a pure function, refactor minimally so the test can call it without spinning up a Zustand store.

### Wave 6.4 — `PersistErrorBanner` integration

**Goal:** prove the banner actually renders when a write fails.

**Tasks**
- Add `src/components/PersistErrorBanner.test.tsx` (vitest with `react-test-renderer`).
- Render the banner; subscribe to `persistWriteErrors`; call `reportPersistWriteError(new Error('forced'))`; flush microtasks; assert the banner now renders the error text.
- Manual UI sweep is still needed but at least the wiring is locked.

---

## Phase B — Behavioural correctness *(unit tests only, still no UI changes)*

### Wave 7 — Fasting timer correctness

**Goal:** the timer is the core feature. Lock its weirdness.

**Tasks (all pure-function tests)**
- W7.1 (negative-clock guard): elapsed math in `app/(tabs)/index.tsx` — extract the `elapsedMs` calc into `src/features/fast/elapsed.ts` if not already pure, then test with `now < startedAt`. Decision: clamp to 0. Document.
- W7.2 (cross-midnight): `dayKeyForIso` already has tests; add a regression test asserting that a fast started at 23:30 yesterday and ended today does not relocate water entries.
- W7.3 (target overrun): given `elapsedMs > targetMs`, `ringProgress` clamps to 1; elapsed continues to advance (so UI doesn't flash 0% remaining).
- W7.4 (end-fast TZ): `endFast()` writes `endedAt` as a full ISO with TZ. Assert in store test.
- W7.5 (background): document only — no test feasible without a real device. Add 1-paragraph note to `APP_OVERVIEW.md`.
- `getFastingStage` boundaries: 0, 59, 60, 23:59, 24:00.

### Wave 8 — Hydration correctness

**Goal:** water tracker has the same day-boundary and unit-conversion hazards as the timer.

**Tasks**
- W8.1 (round-trip): for `oz ∈ [1, 8, 12, 16, 20, 32, 64]`, `mlToOz(ozToMl(x))` is within ±0.05 of `x`. For `ml ∈ [100, 250, 355, 500, 750, 1000, 2000]`, the truncation behaviour of `mlToOz` (one decimal, then rounded for display) is documented and tested.
- W8.2 (day-boundary): hand-rolled `WaterLogEntry[]` at `23:59:59` yesterday and `00:00:01` today; assert `selectWaterTodayMl` returns only the latter.
- W8.3 (remove): a `removeWater` store test — adding 3 entries, removing one, the other two are untouched.
- W8.4 (preset order): `presetsByPrimaryThenRest()` returns primary IDs first AND every preset ID is unique.

---

## Phase C — Code hygiene + a11y *(no behaviour change)*

### Wave 9 — a11y / contrast

**Tasks**
- W9.1 (label grep): grep every `<Pressable`, `<ScalePressable`, `<TouchableOpacity` for missing `accessibilityLabel` or `accessibilityRole`. Patch each.
- W9.2 (contrast): defer the manual screenshot pass to a follow-up. For now, audit `palette.outline` against `palette.surfaceContainerLowest` background and bump to `onSurfaceVariant` if the ratio drops under 4.5:1 in the obvious cases.
- W9.3 (reduce-motion): defer — needs `AccessibilityInfo` plumbing. Open a TODO note.
- W9.4 (font scaling): defer — needs real device screenshots.

### Wave 10.1 — ErrorBoundary audit

**Tasks**
- Read `app/error.tsx`, confirm it renders sensibly under React render errors and a watchdog font-load failure.
- Add `app/error.test.tsx` with a synthetic throw inside a child component; assert the boundary fallback shows.
- Defer Sentry (W10.2) — needs a DSN and account decision.

### Wave 11 — Round-2 dead code

**Tasks**
- W11.1 — `Colors` & `tabBarActive*` are dead in `app/(tabs)/_layout.tsx` because `tabBar={...}` overrides them. Remove the dead options; if `Colors` becomes orphan, mv `constants/Colors.ts` to `TRASH/`.
- W11.2 — Unused `Pressable` import in `app/settings.tsx`. Remove.
- W11.3 — `components/useColorScheme.web.ts` returns hardcoded `'light'`. Document why it exists (web-target stub) or, if web isn't shipping, drop it. Keep for now; document in a top comment.
- W11.4 — Asset audit: `assets/images/` has expo-template defaults. Compare against `app.json` references; mv unreferenced to `TRASH/`.
- W11.5 — `eas.json` review: ensure profiles match how the user actually builds. Likely fine as-is.

---

## Phase D — Design-alignment deltas (visible UI changes)

The current screens already implement the design-system tokens (palette, fonts, radii, spacing). These deltas are component-level polish where the new mocks improve clarity.

### Per-screen delta summary (vs `design-import/stitch_app_interface_design_3/`)

| Screen | Verdict | Action |
|---|---|---|
| `app/(tabs)/index.tsx` | ✅ already very close | none — title rename "Fasting Tracker" → "Fast Coach" if wanted |
| `app/history.tsx` | ✅ same shape, badge labels differ slightly | none — keep current (more nuanced) |
| `app/(tabs)/facts.tsx` | ✅ same shape | none — keep current bento labels (theme-faithful) |
| `app/(tabs)/water.tsx` | ❌ **delta:** design uses one big % ring, currently a different layout | — let Phase D1 handle |
| `app/onboarding.tsx` | ✅ same shape | none |
| `app/settings.tsx` | ❌ **partial delta:** profile card / pro-tier / sign-out are not in scope (would require auth) | implement only what's in scope |

### D1 — Water screen ring redesign

**Goal:** match the design — one large circular ring showing `pct%` of daily goal, value `1,300 / 2,000 ml` underneath, status copy, then Quick Add row, Custom Entry button, Today's Log.

**Decision:** apply if the current screen is meaningfully different. Otherwise leave it.

### D2 — Settings simplification

The Stitch design shows: profile card (avatar/name), preferences (diet, reminders), hydration (daily-goal slider, units), pro-member promo, sign-out, app-version footer.

**In scope (already implemented):**
- Diet preference
- Daily water goal / units
- Sign-out is a no-op without auth — skip
- Profile card is a no-op without auth — skip
- Pro-member is a no-op without IAP — skip
- App-version footer — quick win, add it

**Out of scope (would need a separate PRD):**
- Auth (`firebase-auth` MCP server is available — but this is a feature, not a bug fix)
- IAP / Pro tier
- Push notifications for fasting reminders

### D3 — Title rename "Fasting Tracker" → "Fast Coach"

The design consistently uses "Fast Coach" as the brand. Current code uses "Fasting Tracker" (also the package name). Decision:
- App display name in `app.json` is `"Fasting Tracker"` — leave (changing changes the package install name).
- Header titles in screens — change to "Fast Coach" so the in-app brand matches the design.

---

## Phase E — Native release polish *(deferred — needs user input)*

### Wave 12 — Icons / splash / bundle

- W12.1 — App icon, adaptive icon, monochrome icon → **needs branded artwork from user**.
- W12.2 — Permissions audit — quick win, can do.
- W12.3 — Bundle size — informational, can do.
- W12.4 — Privacy claim — Play Store listing, not code.
- W12.5 — Version bump script — add `bump-version` npm script.

---

## Phase F — Branch hygiene *(deferred — destructive)*

### Wave 13

- W13.1-13.3 — `git worktree remove` / `git branch -D` ops are visible / shared. Will list the exact commands at the end and ask the user to run them.

---

## Final acceptance for "round-3 ready"

- Test count > 50 (Phase A + B target).
- All screens render with current mock data without runtime errors (manual sweep on emulator/device).
- ErrorBoundary verified by a forced-throw test.
- a11y label grep returns zero gaps in `app/`, `src/components/`.
- Dead `Colors`/`Pressable` imports gone.
- One coherent commit per phase (A.1, A.2, ... E.x).
- This file (`PLAN_R3.md`) updated as items land.

## Out of scope for this plan

- Auth, accounts, profile system, IAP / Pro tier, push notifications.
- Sentry / crash reporter (deferred — needs DSN decision).
- Branded icon / splash artwork.
- Migrating `ScalePressable` off the legacy `Animated` API.
- Localisation beyond English.
