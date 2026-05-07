# Sprint 24 Production Smoke Report

This report captures the first production-beta stabilization pass after the Sprint 23 Stitch UI merge.

## Automated Baseline

Run from `/Users/kevoncambridge/Documents/domino-vibes-sprint24`:

```bash
npm run lint
npm run build
npm run test:run
npm run assets:audit
git diff --check
```

Result: all commands exited successfully.

Known warning: `npm run assets:audit` reports large original PNG fallback files. The primary real WebP asset set is complete.

## Production Route Checks

Checked with `curl -I`:

- `https://dominovibes.com/` returned `200`
- `https://dominovibes.com/lobby` returned `200`
- `https://dominovibes.com/login` returned `200`
- `https://dominovibes.com/profile` returned `200`

Result: Netlify SPA fallback is serving deep routes.

## Production Asset Checks

Checked with `curl -I`:

- `https://dominovibes.com/assets/dominoes-real-webp/domino-6-6.webp` returned `200`
- `https://dominovibes.com/assets/dominoes-real-webp/domino-back.webp` returned `200`
- `https://dominovibes.com/assets/dominoes-real-contact-sheet.png` returned `200`

Result: primary real domino assets are available from production.

## Still Required Manual QA

- Log in with real beta test accounts.
- Run a four-player table from lobby through game over.
- Verify hidden hands using browser/network inspection.
- Test lobby, table, and game chat across two or more sessions.
- Test mobile Safari/Chrome for overflow and tap target issues.
- Confirm return-to-lobby cleanup after finished games.

## Notes

- The local Sprint 24 worktree does not include `.env.local`; local browser testing needs Supabase env vars copied in by the developer before authenticated flow testing.
- This sprint should remain stabilization-focused unless a specific regression is reproduced.
