# Inkoku

An offline Android Sudoku game. Quiet screens, tactile number controls, no subtitles.

## Download

Install **Inkoku-1.0.0.apk** from [GitHub Releases](https://github.com/SalvatoreCodes/Inkoku/releases/latest). Android 8.0 or newer. Allow installation from your browser or file manager when Android requests it.

## Play

- Seven difficulties: Beginner, Easy, Medium, Hard, Expert, Master, Legend.
- Three lives. Each incorrect entry costs one; the third mistake ends the run.
- Select a cell, turn **Pen on**, then tap numbers to toggle pencil candidates.
- Correct entries remove matching notes from their row, column, and box.
- Erase and undo work on entries and notes. Undo never restores lives.
- Pause, save & exit, and automatic local saving.
- Offline puzzle generation with exactly one solution; no accounts, ads, tracking, or network permission.
- Portrait phone layout, accessible control labels, keyboard support, reduced-motion support.

Difficulty tiers target 50, 44, 38, 33, 29, 26, and 24 givens. Generation preserves a unique solution and may retain extra givens if the removal search cannot meet its target. These are clue-density tiers, not technique-rated human difficulty guarantees.

## Progression

Wins earn 60 / 90 / 130 / 180 / 250 / 340 / 460 base XP by difficulty.

- 1–3 stars based on remaining lives.
- Perfect run: +40 XP.
- Daily challenge: Medium puzzle shared by local date, +150 XP once per date.
- Daily win streak: +10 XP per streak day, capped at +70 XP per win.
- Seven ranks: Seed (0), Sprout (200), Grove (600), Bloom (1,400), Sage (2,800), Master (5,000), Legend (8,000).
- Paper theme from the start; Moss at Sprout, Dusk at Bloom, Midnight at Master.
- Six achievement badges and personal best times for every difficulty.

All seven difficulties are playable immediately. Rank progression unlocks cosmetic themes. Data lives on your device; uninstalling or clearing app storage can remove progress. Daily dates use the device clock.

## Development

No JavaScript dependencies or web build step.

```sh
npm test
npm start
```

Open http://127.0.0.1:4173. Keyboard: 1–9 entry, N pen, Z undo, Delete erase, arrows select.

### Android

Requirements: JDK 17+, Android SDK platform 36, and Build Tools 35.0.0. Gradle wrapper: 8.14.3, Android Gradle Plugin: 8.10.1. The [official AGP compatibility notes](https://developer.android.com/build/releases/agp-8-10-0-release-notes) document API 36 support.

Set `ANDROID_HOME` and `JAVA_HOME`, or configure Android Studio. Then:

```sh
./gradlew assembleDebug lint
```

On Windows use `gradlew.bat`. The debug APK appears in `app/build/outputs/apk/debug/`.

For signed release builds, provide `INKOKU_KEYSTORE` (absolute JKS path), `INKOKU_STORE_PASSWORD`, and key alias `inkoku`, then run:

```sh
./gradlew assembleRelease lint
```

Release APK: `app/build/outputs/apk/release/app-release.apk`. Keep the release keystore private and backed up: future updates must use the same signing key. Local signing material is excluded by `.gitignore`.

## Architecture

- `engine.js`: seeded generator, uniqueness solver, immutable givens, lives, notes, progression.
- `worker.js`: background puzzle generation, with a main-thread fallback.
- `app.js` / `style.css`: touch UI, local persistence, themes, pause and navigation.
- `MainActivity.java`: Android WebView host serving bundled assets from a private HTTPS origin. External requests are blocked; no JavaScript-native bridge.
- `tests/engine.test.js`: generation, lifecycle, scoring, and progression tests.
- CI checks the engine, Android build, and Android lint.

## Validation

See [QA.md](QA.md). Browser gameplay and local signed APK build verified. Physical-device and emulator runtime testing have not been performed.
