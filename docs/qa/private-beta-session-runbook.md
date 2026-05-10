# Private Beta Session Runbook

Use this when coordinating a live Domino Vibes beta test with four testers.

## Before The Session

- Confirm the latest `main` deploy is live on `https://dominovibes.com`.
- Run the release gate checks in `docs/qa/private-beta-release-gate.md`.
- Use test accounts only.
- Ask testers to avoid sharing passwords, auth tokens, or hidden hand tile details in reports.
- Remind testers that Domino Vibes is a social domino game beta, not a gambling product.

## Tester Setup

Ask each tester to capture:

- Device and browser.
- Account email used.
- Table URL and game URL.
- Screenshots or screen recordings for bugs.
- Whether the bug happened after refresh, rejoin, or multiple tabs.

## Required Test Missions

1. Create and confirm an account.
2. Complete profile setup.
3. Join a Cutthroat 4 table with four testers.
4. Ready up and start the game.
5. Confirm each player sees only their own hand.
6. Play legal tiles and pass when blocked.
7. Send lobby, table, and game chat messages.
8. Refresh during the game and rejoin successfully.
9. Finish at least one round.
10. Start the next round if time allows.
11. Test one mobile browser or phone-sized viewport.

## Stop The Session Immediately If

- A tester sees another player's hand tiles.
- A non-participant can access a game hand or game chat.
- Multiple testers cannot sign up or log in.
- A player can play out of turn.
- The game cannot continue and refresh/rejoin does not recover it.
- Mobile layout prevents a player from taking a turn.

## Bug Capture Format

```text
Title:
Severity: blocker / major / minor / polish
Device/browser:
Account used:
URL:
Round number:
What happened:
What I expected:
Steps to reproduce:
Screenshot/video:
Console error, if any:
Refresh/rejoin involved? yes/no
```

## After The Session

- Triage blocker and major issues before inviting more testers.
- Add accepted minor/polish issues to `docs/known-issues.md` or an issue tracker.
- Re-run the standard check suite after fixes:

```bash
npm run lint
npm run build
npm run test:run
npm run assets:audit
git diff --check
```
