# Release 1.0.0 validation

- Node tests: unique solutions for 35 puzzles across all seven tiers; valid solutions; deterministic daily seed; three-mistake loss; life-safe undo; notes/erase; fixed givens; idempotent win rewards; daily bonus deduplication; consecutive-day streaks and rank thresholds.
- Mobile browser: 390 × 844 and 320 × 740. No horizontal overflow. Keypad targets at least 50 × 54 CSS pixels at 320px width.
- Full game completed through the UI: 3 stars, 110 XP for a perfect Beginner win on streak day one.
- Legend game lost through three incorrect UI entries; no extra win awarded.
- Pencil candidates persisted to local storage.
- Signed release APK built with Android Gradle Plugin 8.10.1 and SDK 36.
- Android lint: zero errors. Informational warnings: newer Gradle available, and JavaScript enabled for the bundled game. WebView blocks external requests and has no native JavaScript bridge.
- No Android device or emulator was available. APK runtime on Android remains unverified.
