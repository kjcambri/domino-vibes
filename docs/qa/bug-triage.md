# Domino Vibes Private Beta Bug Triage

Use this guide to turn tester feedback into actionable fixes without losing security or gameplay context.

## Intake Rules

- In-app beta feedback arrives through `feedback@dominovibes.com` with a
  prefilled report template.
- Ask for browser, device, route, account, table/game URL, exact steps, expected behavior, actual behavior, and screenshots or video.
- Ask whether the tester refreshed, rejoined, or used multiple tabs.
- For game issues, capture the game ID and round number.
- For auth issues, capture the email provider/rate-limit context without storing passwords or tokens.
- For hidden-hand reports, treat the issue as high priority until proven otherwise.

## Severity Levels

### Blocker

Fix before inviting more testers.

- Signup/login is broken for multiple testers.
- App cannot load production routes.
- Hidden hands or private game state are exposed.
- Players can play out of turn, play tiles they do not own, or bypass pass/play validation.
- Game cannot progress and no safe cleanup/rejoin path exists.

### Major

Fix before a wider beta wave.

- Current turn, board, hand count, or chat does not update without manual refresh.
- Return-to-lobby cleanup leaves production tables stuck.
- Mobile layout blocks a core action.
- Start next round or game over flow fails.
- Chat access is available to the wrong room.

### Minor

Fix opportunistically during stabilization.

- Text clipping or awkward spacing on one browser size.
- Confusing empty/loading/error copy.
- Visual mismatch that does not block play.
- Presence status is slow or unclear.

### Polish

Track for later design passes.

- Animation, timing, decorative styling, or final art concerns.
- Non-blocking wording improvements.
- Future mode teaser layout tweaks.

## First Response Template

```text
Thanks for the report. Can you send:
- browser/device
- URL or game/table ID
- steps to reproduce
- what you expected
- screenshot/video
- whether this happened after refresh/rejoin
```

## Reproduction Checklist

1. Try the same route in production.
2. Try the route in a clean browser profile.
3. Check whether the tester is logged in and has a completed profile.
4. For table/game bugs, test with at least two sessions.
5. For hidden-hand concerns, inspect network responses for `game_player_hands` or opponent tile arrays.
6. Check Supabase logs/RPC errors only when needed; do not paste sensitive payloads into public issues.

## Fix Rules

- Fix one confirmed regression per branch when possible.
- Do not change gameplay rules while fixing UI/realtime bugs.
- Do not change RLS/RPCs unless the bug is confirmed server-side.
- Add docs or tests when the reproduction path is easy to encode.
- Always run the standard check suite before opening a PR.

## Standard Check Suite

```bash
npm run lint
npm run build
npm run test:run
npm run assets:audit
git diff --check
```

## Closeout Template

```text
Fixed in:
Verified with:
Manual QA:
Remaining risk:
Tester should retry:
```
