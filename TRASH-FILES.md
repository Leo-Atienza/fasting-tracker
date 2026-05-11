# TRASH/ — Removed Files

Project-local trash for files removed from the working tree. Restored from git if needed; not tracked by lint or tests.

## 2026-05-11 — APK bundle inspection scratch

- `TRASH/bundle-check-extracted/` — moved from `/tmp/bundle-check` — one-off `jar xf` extraction of `assets/index.android.bundle` to verify new strings (Fasting Tracker / fasting-milestone) made it into the v1.0.6 debug APK. Safe to delete.

## 2026-05-10 — Wave 4 housekeeping cleanup (FIX_PLAN.md)

Dead Expo template scaffolding left over from `npx create-expo-app`. None of these were consumed by the live app after the FastCoach UI replaced the starter screens.

- `components/EditScreenInfo.tsx` — Expo starter info card; no importers.
- `components/ExternalLink.tsx` — only `EditScreenInfo.tsx` imported it.
- `components/StyledText.tsx` — only `components/__tests__/StyledText-test.js` imported it.
- `components/__tests__/` — Jest-style test (`StyledText-test.js`); project uses vitest and never picked it up.
- `components/Themed.tsx` — themed `<Text>` / `<View>` wrappers. The only live consumer (`app/+not-found.tsx`) was rewritten to use `FastCoachPalette` directly.
- `assets/fonts/SpaceMono-Regular.ttf` — registered in `app/_layout.tsx` but the only style that set `fontFamily: 'SpaceMono'` was inside `StyledText.tsx`.
