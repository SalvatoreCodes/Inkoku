# Sudoku

Android Sudoku with accounts, a shared scoreboard, and collectible profile cosmetics.

[Download Sudoku 2.0](https://github.com/SalvatoreCodes/Inkoku/releases/latest). Android 8.0+. Install over Inkoku 1.x to keep existing saves. The application ID and signing key are unchanged; the launcher name is now **Sudoku**.

## Play

Seven difficulties, exactly three mistakes per run, pencil candidates, undo, erase, pause, and autosave. All nine candidates stay inside fixed-size cells. The home screen has no title or marketing headline.

Difficulty tiers target 50, 44, 38, 33, 29, 26, and 24 givens. Every generated puzzle has one solution. These are clue-density tiers, not technique-rated human difficulty guarantees.

## Accounts and scoreboard

- Email/password signup, sign-in, sign-out, session renewal, and password changes.
- Immediate signup without email confirmation, as selected by the owner.
- **Password-reset emails are not enabled.** Configure custom SMTP before enabling recovery delivery. The app shows this limitation rather than pretending an email was sent.
- Account-specific local saves and cloud profile/cosmetic sync.
- Signed-in online games receive server-issued run IDs. Completed move histories are replayed on the server before ranked XP is awarded.
- All-time and current UTC-week leaderboards, difficulty filters, top 50, and your own rank.
- Duplicate submissions cannot award XP twice. Only the run's owner can submit it.
- Offline practice earns personal progression, but no ranked score. Pending online scores retry when connected, within the run's 24-hour validity.
- Ranked daily challenges use UTC. Guest daily challenges use the device's local date.

Personal XP includes local practice and legacy progress, so it is not a trusted competitive measure. The scoreboard uses a separate server-calculated XP ledger. Move validation prevents arbitrary score insertion and duplicate claims; it does not prevent automated solving or client modification.

## Thirty levels

Level 2 requires **1,000 XP**. Every following level costs **350 XP more** than the previous one.

Total XP for level L: `1000 × (L−1) + 175 × (L−1) × (L−2)`.

There is a reward at every level, with 31 reward items across 30 levels:
avatars, profile backgrounds, four animated backgrounds, avatar frames, animated Prism frame, six launcher icon choices including the default, five app themes, and profile titles. Reduced-motion settings stop decorative animation.

Wins earn 60 / 90 / 130 / 180 / 250 / 340 / 460 base XP. Perfect runs add 40; daily challenges add 150 once per date; streak bonus adds 10 per day, capped at 70.

Old XP and previously unlocked themes remain available. Existing level numbers are recalculated against the harder curve.

## Development

No JavaScript dependencies or web build step.

```sh
npm test
npm start
```

Open http://127.0.0.1:4173. Keyboard: 1–9 entry, N pen, Z undo, Delete erase, arrows select.

### Android build

JDK 17+, Android SDK platform 36, Build Tools 35.0.0. Set `JAVA_HOME` and `ANDROID_HOME`.

```sh
./gradlew assembleDebug lint
```

For release, set `INKOKU_KEYSTORE` to the existing private JKS path and `INKOKU_STORE_PASSWORD` to its password. Alias remains `inkoku`, preserving update compatibility.

```sh
./gradlew assembleRelease lint
```

Windows: use `gradlew.bat`. APK output: `app/build/outputs/apk/release/app-release.apk`. Signing material stays outside Git in ignored local storage. Keep it backed up privately.

### Backend

Supabase project: `wzxbznsmvcoshlswlnoo`, Singapore, in the owner's selected organization. Initial project quote: $0/month. Normal provider quotas and future pricing still apply.

- Schema: `supabase/migrations/`.
- API: `supabase/functions/sudoku-api/`.
- Public connection settings: `backend-config.js`; Android host allowlist: `CloudConfig.java`.
- All tables have RLS enabled; no client grants or policies permit direct access. Only the authenticated edge API accesses them with its server-only service credential.
- The legacy edge JWT gate is off; the function validates **every request** against Supabase Auth's user endpoint before handling any action. Anonymous users are rejected.
- Database functions use invoker security and are executable only by the service role.
- Public scoreboard exposes display names and equipped cosmetics, not emails or private saves.
- Native WebView permits bundled assets and the exact backend HTTPS host. Session data is excluded from Android backup and transfer.

Deploy the migration with Supabase tooling, then:

```sh
supabase functions deploy sudoku-api --project-ref wzxbznsmvcoshlswlnoo --no-verify-jwt
```

The bundled server copies of `engine.js` and `progression.js` must match the client; tests enforce this.

For email recovery, configure [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), restore the recovery request in `account.js`, and rebuild. Native auth redirect: `sudoku://auth/callback`.

The security advisor reports informational [RLS enabled with no policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) notices. This is intentional: these tables are accessible only through the edge API.

## Validation

See [QA.md](QA.md). Live signup, login, token refresh, ranked win, duplicate rejection, cross-account isolation, and cosmetic persistence verified. Signed APK and Android lint pass. Android device runtime and launcher-icon changes still need device verification.
