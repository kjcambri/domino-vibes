# Domino Vibes

Domino Vibes is a mobile-first Caribbean/Latino multiplayer dominoes web app for real-time Cutthroat 4 play.

Production: [dominovibes.com](https://dominovibes.com)

## Current MVP

- Supabase Auth and profile setup
- Lobby and system-created tables
- Table seats, ready state, and start-game flow
- Secure hidden hands
- Server-side `play_tile` and `pass_turn` validation
- Server-saved board geometry
- Cutthroat 4 scoring: first to 6 only wins if at least one player remains at 0
- Round complete, next round, game over, and return-to-lobby cleanup
- Rejoin active games
- Presence and active/away status
- Lobby, table, and game chat
- Homepage live match preview with safe public board/player summaries
- Real WebP domino assets with fallback asset paths
- Stitch-inspired Island Elite Social Club UI direction

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Do not commit `.env.local`. Configure production values in Netlify.

## Supabase Auth Email

Domino Vibes keeps Supabase email confirmation enabled. The default Supabase Auth email sender is suitable for quick local checks, but it is limited to 2 auth emails per hour. For production or multi-user testing, configure custom SMTP in Supabase so signup confirmations and resend-confirmation emails are delivered reliably.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run test:run
npm run assets:audit
```

Useful asset scripts:

```bash
npm run assets:import-real
npm run assets:contact-sheet-real
npm run assets:normalize
```

## Private Beta Docs

- [Private beta checklist](docs/qa/private-beta-checklist.md)
- [Private beta tester guide](docs/qa/private-beta-tester-guide.md)
- [Bug triage guide](docs/qa/bug-triage.md)
- [Release gate checklist](docs/qa/private-beta-release-gate.md)
- [Netlify smoke test](docs/qa/netlify-online-smoke-test.md)
- [Supabase RLS checklist](docs/security/supabase-rls-checklist.md)
- [Known issues](docs/known-issues.md)

Private beta testers can also use the in-app **Report a bug** / **Send beta feedback**
links on the landing, lobby, and profile screens. These links open an email draft
to `feedback@dominovibes.com` with the expected bug-report fields.

## Guardrails

- Use test accounts and test data for beta.
- Do not disable email confirmation unless explicitly approved.
- Do not expose hidden hands through UI, logs, network responses, or public previews.
- Do not add real-money, prize, betting, or casino mechanics.
- Keep future mode cards visibly disabled until the backend/product systems exist.
