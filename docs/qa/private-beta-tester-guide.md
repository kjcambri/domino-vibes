# Domino Vibes Private Beta Tester Guide

Use this guide when inviting a small group of testers to `https://dominovibes.com`.

## Ground Rules

- Use test accounts and test data only.
- Domino Vibes is a social domino game beta, not a gambling product.
- Do not use real-money, prize, or betting language when reporting issues.
- Report bugs with browser, device, user account, game/table URL, steps, screenshot, and what you expected to happen.

## First-Time Tester Flow

1. Open `https://dominovibes.com`.
2. Create an account with a test email.
3. Confirm the account from email if confirmation is enabled.
4. Log in.
5. Create your profile.
6. Enter the lobby.
7. Join a waiting Cutthroat 4 table.
8. Ready up when all four seats are filled.
9. Start the game and play a few turns.

## Core Test Missions

The in-app private beta checklist mirrors these missions on the landing page
and lobby so testers can keep the same priorities in view while using the app.

### Lobby

- Confirm the landing page and lobby feel polished on mobile and desktop.
- Confirm the current table or active game banner appears when expected.
- Send a lobby chat message and confirm another tester sees it.
- Confirm Coming Soon cards are disabled and do not navigate.

### Table Room

- Try sitting in an open seat.
- Try ready/unready.
- Confirm occupied seats cannot be taken.
- Confirm table chat works for seated players.
- Confirm active/away status is visible.

### Game Room

- Confirm your own hand loads.
- Confirm opponent hands show counts only, never tile faces.
- Select a tile and play start/left/right where legal.
- Pass only when blocked.
- Confirm the current turn banner updates after moves.
- Send a game chat message.
- Refresh the game route and confirm you can rejoin.
- Finish a round if possible, then start the next round.
- Finish a game if possible, then return to lobby.

## Mobile Checks

- Test at least one iPhone or Android browser.
- Watch for text clipping, horizontal page overflow, tiny tap targets, or hand tray scroll issues.
- Confirm board scrolling and hand scrolling are usable.
- Capture screenshots of any broken layout.

## Bug Report Template

Use the in-app **Report a bug** or **Send beta feedback** link from the landing,
lobby, or profile screens. It opens an email draft to
`feedback@dominovibes.com` with this template. If GitHub Issues are available,
use the "Private beta bug report" template instead.

```text
Title:
Device/browser:
Account used:
URL:
What happened:
What I expected:
Steps to reproduce:
Screenshot/video:
Console error, if any:
Severity: blocker / major / minor / polish
```

Do not include passwords, auth tokens, or hidden hand tile details in feedback.

## Stop-and-Report Issues

Report these immediately:

- Any player can see another player's hidden hand.
- A non-participant can access a game, hand, or game chat.
- A player can play out of turn.
- A game gets stuck with no visible recovery path.
- Signup/login breaks for multiple testers.
- Mobile layout prevents playing a turn.
