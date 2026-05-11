# Fasting Tracker

A small, offline-first phone app for intermittent fasting and hydration. Pick a
goal length, start a fast, and the ring counts up while the screen tells you
which physiological phase you're in. Log water against a daily target on a
separate tab, and review a week of streaks and totals under Insights.

Currently built and distributed as a sideloadable Android APK; iOS and web
builds are wired but not regularly tested.

## Features

- **Fasting timer** — circular timer with goal-length presets (Open / 12h / 14h /
  16h / 18h / 24h). Live "current phase" card explains what the body is
  doing (glycogen depletion → ketosis → autophagy etc.).
- **Four-step onboarding** — pick a default fasting goal, a dietary profile,
  a daily water target, and opt into local milestone reminders. Selections
  prefill across the app and remain editable in Settings.
- **Eat suggestions** — meal/snack ideas filtered by the diet preference you
  set at onboarding (omnivore, vegetarian, vegan, pescatarian, meat-forward),
  shuffleable, with separate ideas for during-fast vs. eating-window phases.
- **Water tracker** — preset buttons (glass, bottle, mug, etc.) and a custom
  amount entry, ml/oz toggle, edit mode for removing entries.
- **Insights** — 7-day fasts and water bar charts, current streak, totals.
- **History** — full session log with per-row delete and clear-all.
- **Local milestone reminders** — opt-in notifications at 12h / 16h / 20h
  into an active fast (via `expo-notifications`). Scheduled on-device only —
  no servers, no push tokens.
- **Accessibility** — every interactive element has a role and label; honors
  the OS "Reduce motion" toggle (animations collapse to instant transitions).
- **Persistence** — zustand + AsyncStorage with a versioned schema and
  defensive migration so a corrupt store can't brick the boot.

## Tech

- Expo SDK 54 (React Native 0.81, New Architecture enabled, Hermes)
- TypeScript, strict mode
- expo-router v6 (file-based routing under `app/`)
- zustand with persist middleware
- react-native-svg for the ring, react-native-safe-area-context, react-native-screens
- Vitest for unit tests (pure-logic helpers in `src/features/*` and `src/lib/*`)

## Getting started

```pwsh
npm install
npm start          # Metro on port 8089
npm run android    # build + run on a connected device/emulator (uses Metro)
npm run ios        # macOS only
npm run web        # static export
```

`npm run typecheck` and `npm test` run TypeScript and Vitest respectively.

## Building a sideloadable APK

Hand-off APKs are produced with the project's plain Gradle pipeline. The trick
here is that **`assembleDebug` by default does not embed the JS bundle** — it
expects a Metro dev server at runtime. A debug APK distributed to a phone with
no Metro reachable will show the splash screen and never progress past it.

This repo includes an Expo config plugin
([plugins/withStandaloneDebugApk.js](plugins/withStandaloneDebugApk.js)) that
patches `android/app/build.gradle` so the debug variant:

- bundles JS and assets into the APK (`debuggableVariants = []`)
- runs as `debuggable false`, which flips `BuildConfig.DEBUG` and makes React
  Native load the bundled JS instead of reaching for Metro
- keeps signing on the debug keystore so the result installs over a previous
  build without an uninstall step

So the full local-build flow is:

```pwsh
cd android
.\gradlew assembleDebug
```

Output: `android\app\build\outputs\apk\debug\app-debug.apk`. Verify it actually
contains the bundle before shipping:

```pwsh
# expect "assets/index.android.bundle"
& "$env:JAVA_HOME\bin\jar" tf .\android\app\build\outputs\apk\debug\app-debug.apk | Select-String 'bundle'
```

If you ever run `npx expo prebuild --clean`, the plugin re-applies these
patches automatically — there is nothing to remember manually.

### Why not `assembleRelease`?

`assembleRelease` would also embed the bundle and is the textbook answer. On
this Windows host it fails: the C++ codegen output path
`.cxx/RelWithDebInfo/<hash>/<abi>/.../<long-source-path>.cpp.o` exceeds
Windows' 260-character `MAX_PATH` limit during
`react_codegen_safeareacontext` compilation. The registry has
`HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem\LongPathsEnabled = 1`,
but `ninja.exe` in the Android SDK does not declare long-path-awareness in
its manifest, so the OS still rejects. The debug variant's
`.cxx/Debug/...` paths are about 9 characters shorter and fit, which is why
the workaround above sticks to `assembleDebug`.

To enable long-path support yourself (one-time, requires an **elevated**
PowerShell — non-elevated shells get `Requested registry access is not
allowed` when writing HKLM):

```pwsh
New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' `
  -Name 'LongPathsEnabled' -Value 1 -PropertyType DWord -Force
# Check current value any time:
(Get-ItemProperty -LiteralPath 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem').LongPathsEnabled
```

That fixes other long-path tooling but does not by itself rescue
`assembleRelease`, so the standalone-debug pipeline above is still the
recommended path for hand-off APKs on Windows.

## Versioning

One script keeps `package.json`, `app.json`, and `android/app/build.gradle`
in lockstep:

```pwsh
npm run bump:patch   # 1.0.3 -> 1.0.4
npm run bump:minor   # 1.0.5 -> 1.1.0
npm run bump:major   # 1.5.0 -> 2.0.0
# or pin: node scripts/bump-version.mjs 1.2.3
```

The `versionCode` is derived as `major * 10000 + minor * 100 + patch`, so
1.2.3 → 10203. Minor and patch must each stay under 100.

## Project layout

```
app/                     expo-router screens (file = route)
  (tabs)/                Fast / Water / Insights / Facts tab group
  onboarding.tsx         first-run diet preference picker
  history.tsx            fast session history
  settings.tsx           preferences
  error.tsx              route-level ErrorBoundary
components/              cross-app primitives (re-exports, color scheme)
constants/               theme tokens (palette, fonts, spacing)
src/
  components/            FastCoach UI kit (CircularRing, GlassCard, ...)
  features/              pure logic — fast/, water/, eat/, insights/
  hooks/                 useStoreHydrated, useReduceMotion
  lib/                   time, units, ids
  store/                 zustand store, persist migration, selectors
  storage/               AsyncStorage wrapper, persist write-error surface
plugins/                 local Expo config plugins
scripts/                 bump-version.mjs and helpers
```

