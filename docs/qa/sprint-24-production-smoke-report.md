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

## Four-Player Production QA

Ran a four-account production QA pass against `https://dominovibes.com` using throwaway/private beta test accounts.

Covered:

- Four accounts logged in and reached the lobby.
- A waiting table was joined and filled with four seats.
- All four accounts toggled ready state.
- The game started and all four accounts loaded the game room.
- Game chat sent from one participant and appeared for another participant.
- Multiple turns were played by all four accounts.
- Pass flow occurred during blocked turns.
- Round complete was reached multiple times.
- Start Next Round worked after completed rounds.
- A Game Over state was reached.
- All four accounts used Return to Lobby from the finished game.

Automation summary:

- Initial smoke: 4 turns across all accounts, chat visibility, own rack/opponent count labels, and `get_game_room` network responses checked for absence of `game_player_hands`.
- Full-game continuation: 138 automated play/pass actions, 5 next-round starts, Game Over reached, and 4/4 accounts returned to lobby.
- Failures: 0.
- Warnings: 0.

Security observation:

- Captured `get_game_room` RPC responses did not contain `game_player_hands`.
- `get_my_hand` responses contained only the authenticated player's hand data, as expected.

## Still Required Manual QA

- Test mobile Safari/Chrome on real devices for overflow and tap target issues.
- Spot-check production visually with a human reviewer after Netlify deploys.
- Rotate or delete private beta test-account passwords used during this QA pass.

## Notes

- The local Sprint 24 worktree does not include `.env.local`; local browser testing needs Supabase env vars copied in by the developer before authenticated flow testing.
- This sprint should remain stabilization-focused unless a specific regression is reproduced.
