# Fasting Tracker — App Overview

## What this app is

**Fasting Tracker** is a cross-platform mobile app (built with **Expo** and **React Native**) that helps you practice intermittent fasting with a simple timer, optional goals, hydration tracking, and supportive content. It presents itself as a **“Fast coach”**: you track your fasting window, stay mindful of water intake, and see meal ideas tailored to how you eat—without replacing medical advice.

All core data (fasts, water log, settings, favorites) is stored **locally on the device** using persisted app state (AsyncStorage via Zustand). Nothing in this description implies cloud sync or accounts unless you add them later.

---

## Main functions

### Fast tab (home — “Fast”)

- **Start a fast** with an optional target length: open-ended, or fixed windows such as 12, 14, 16, 18, or 24 hours.
- **Live elapsed timer** while fasting, with progress toward the goal when a target is set.
- **End fast** with confirmation; completing a fast **saves a session** to history (start time, end time, optional goal).
- **Eat suggestions** tied to context (during a fast vs. between fasts), filtered by **diet preference**, with a shuffle control for new picks.
- Short on-screen note that fasting rules vary; users should align with their own approach and trusted clinicians.

### Water tab (“Water”)

- **Daily hydration goal** versus **today’s total**, with a progress bar and percentage.
- **Quick presets** to log common amounts (styled as tappable tiles).
- **Today’s log** of entries with timestamps.
- Goal and units are configured in **Settings** (see below).

### Facts tab (“Facts”)

- Displays **short fasting-related facts** from bundled JSON (themes, titles, bodies)—educational snippets, not prescriptions.
- **Shuffle** to see another fact (deterministic mix by day and shuffle count).
- **Star favorites** and review them in a **Favorites** section on the same screen.
- Includes a **health disclaimer** (e.g., medications, pregnancy, eating disorders—consult a clinician).

### Onboarding

- Shown until the user completes or skips it.
- Asks **how you usually eat** to personalize **meal suggestions** only (not medical profiling).
- Users can **skip** and still use the app.

### Fast history (stack screen, opened from the Fast tab header)

- Lists **completed fasts** with start/end times, **duration**, and **goal** (if any).
- Empty state explains that history fills when you finish a fast from home.

### Settings (stack screen, opened from the Fast tab header)

- **Diet preference** — choose among predefined options; affects **meal suggestion filtering** only.
- **Hydration defaults** — daily water goal and **ml / oz** unit; goal drives the Water tab progress.

### App shell

- **Light / dark** theming follows the system where supported.
- Tab navigation: **Fast**, **Water**, **Facts**; modal-style stack for **History** and **Settings**.

---

## Disclaimer

Content in the app (facts, suggestions, copy) is for **general wellness context**, not diagnosis or treatment. Users with health conditions or questions should rely on qualified professionals.

---

## How the timer behaves in the background

The fasting timer is **wall-clock-derived**, not interval-driven. The on-screen value is recomputed every second from `Date.now() − startedAt` while the screen is mounted, and the only persistent state is `activeFast.startedAt` (an ISO timestamp). Practical consequences:

- When the OS suspends the JS thread (screen off, app backgrounded, low-memory swap), the displayed counter does not advance — but the underlying *truth* is the timestamp, so the next time you open the app the value snaps to the correct elapsed time.
- The 1 s `setInterval` is owned by `useEffect` cleanup, so it cannot leak across remounts.
- If the device clock jumps **backward** (manual change, NTP correction), `computeElapsedMs` clamps to 0 rather than going negative.
- If the clock jumps **forward**, the timer follows the clock — by design, since the start time is the fixed anchor.
- Fasts that cross midnight do **not** relocate water log entries; both selectors are scoped to the device's local-day key at lookup time, not at write time.

There is no Android foreground-service notification keeping the JS thread alive while the app is closed. That was a deliberate tradeoff: fasting is asynchronous from the app's perspective, and the timestamp anchor is correct without it. If push reminders or a persistent notification become a requirement, that is a separate epic (would need `expo-notifications` + a background task).
