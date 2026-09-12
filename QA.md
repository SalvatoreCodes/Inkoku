# Sudoku 2.0 validation

## Automated

13 Node tests pass:
- 35 unique-solution puzzles spanning all seven difficulties.
- Three-mistake loss, notes, erase, life-safe undo, immutable givens.
- Daily seeds, reward idempotency, streaks.
- Increasing 30-level XP curve, reward at every level, cosmetic locks.
- Legacy XP/theme migration.
- Server replay: solved board accepted; incomplete, malformed, post-win, and three-mistake histories rejected.
- Profile payload sanitation and identical client/server engine modules.

## Live Supabase

Temporary QA accounts only; removed after verification, including their scores.
- Signup without confirmation succeeded.
- Invalid password rejected; valid sign-in and sign-out succeeded.
- Forced token expiration renewed the session; authenticated profile request succeeded.
- Valid Beginner run awarded 110 ranked XP.
- Duplicate submission returned the same receipt without another award.
- Second account could not submit first account's run.
- Authenticated direct table access returned HTTP 403.
- All-time scoreboard displayed the correct rank and single win.
- Equipped Aurora background persisted through sign-out/sign-in.
- Locked Nebula background refused at level 10.
- All app tables have RLS; no anon/authenticated direct grants.
- Advisor: only three informational no-policy notices, intentional for edge-only tables.

## UI and Android

- Home has neither app-title text nor marketing headline.
- Narrow 320px layout has no horizontal page overflow.
- Aurora animation applied; other animated items use the same reduced-motion safeguards.
- Signed Android build and lint pass.
- Original app ID and signing key retained for in-place updates.
- No Android device/emulator available. Native icon switching and Android runtime remain unverified.

## Previous release regression

Version 1.0.1 locked all board tracks and positioned notes inside each cell. Empty and full nine-note cells retained identical dimensions at 320px and 390px widths. These sizing rules remain in 2.0.
