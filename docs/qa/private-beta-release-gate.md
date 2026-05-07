# Private Beta Release Gate

Use this checklist before merging a beta-readiness branch or inviting a larger tester group.

## Required Automated Checks

Run from a clean worktree:

```bash
npm run lint
npm run build
npm run test:run
npm run assets:audit
git diff --check
```

Gate: all commands must exit successfully. Known asset-audit warnings about large original PNG fallback files are acceptable if the real WebP set is complete.

## Production Smoke Gate

Verify after deploy:

- `https://dominovibes.com/` loads over HTTPS.
- `/login`, `/signup`, `/lobby`, `/profile`, `/tables/:tableId`, and `/games/:gameId` refresh without Netlify 404s.
- Real domino assets load from `/assets/dominoes-real-webp/`.
- No console errors mention missing Supabase environment variables.
- Signup confirmation messaging is clear.
- Login redirects into the expected profile/lobby flow.

## Manual Gameplay Gate

Run at least one four-player test with throwaway accounts:

- All four users can join a table.
- Ready/start game works.
- Each user sees only their own hand.
- Opponents show counts only.
- Play start, play left/right, pass, and invalid pass behave correctly.
- Current turn updates for all users.
- Board and hand still render after refresh/rejoin.
- Round complete and start next round work.
- Game over works.
- Return to lobby releases finished seats.
- Lobby/table/game chat works only for allowed users.

## Mobile Gate

Test at least one real mobile browser or equivalent device viewport:

- No page-level horizontal overflow.
- Hand tray scrolls comfortably.
- Board scrolls without trapping the whole page.
- Primary actions are thumb-friendly.
- Text does not overlap cards/buttons.
- Chat does not cover core gameplay controls.

## Security Gate

Confirm:

- `get_game_room` does not expose `game_player_hands`.
- Homepage live preview returns board placements and hand counts only.
- Non-participants cannot load `get_my_hand`.
- Non-participants cannot send table/game chat.
- Users cannot clear someone else's finished-game seat.
- No hidden hand data is logged in the browser console.

## Release Decision

Release is blocked if any blocker or major issue is open.

Release can proceed with minor/polish issues only if:

- The issue is documented in `docs/known-issues.md` or an issue tracker.
- The issue does not expose private data.
- The issue does not block a player from completing a turn.
- The issue does not prevent return-to-lobby cleanup.

## Post-Release Watch

For the first hour after a beta deploy:

- Watch Netlify deploy status.
- Watch Supabase Auth signup/email behavior.
- Watch for stuck tables.
- Collect screenshots from testers.
- Log any issues using the bug triage template.
