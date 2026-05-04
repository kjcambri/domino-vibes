# Netlify Online Smoke Test

Run this after every Netlify deploy before inviting testers.

## Deployment Basics

1. Open the Netlify deploy URL.
2. Open `https://dominovibes.com`.
3. Confirm both load Domino Vibes over HTTPS.
4. Open DevTools and confirm there are no missing environment variable errors.
5. Confirm no console errors mention Supabase URL/key configuration.

## Deep Route Refresh

Refresh each route directly and confirm there is no Netlify 404:

1. `/lobby`
2. `/profile`
3. `/tables/:tableId`
4. `/games/:gameId`

Expected result: Netlify serves the React app and the route loads or shows the app's own protected/not-found state.

## Auth and Profile

1. Sign up with a test account.
2. Confirm email verification behavior if enabled.
3. Log in.
4. Create or update the profile.
5. Log out and back in.

## Lobby and Table

1. Load lobby tables.
2. Join a table.
3. Confirm the current table banner appears.
4. Open four test users.
5. Seat all four users.
6. Ready all four users.
7. Start the game.

## Gameplay

1. Confirm each user sees only their own hand.
2. Play the first tile.
3. Play left and right where legal.
4. Pass when blocked.
5. Refresh a game route and confirm rejoin works.
6. Finish a round.
7. Start the next round.
8. Finish a game.
9. Return to lobby and confirm finished seats clear.

## Chat

1. Send lobby chat as User A.
2. Confirm User B sees the message.
3. Send table chat as a seated user.
4. Confirm non-seated users cannot read or send table chat.
5. Send game chat as a game participant.
6. Confirm non-participants cannot read or send game chat.

## Assets

Open these URLs on the deployed site:

```text
/assets/dominoes-webp/domino-6-6.webp
/assets/dominoes/domino-6-6.png
```

Expected result: both assets load. In the game room, dominoes should render as optimized images and fall back safely if needed.

## Mobile

1. Test iPhone Safari if available.
2. Test iPhone Chrome if available.
3. Test Android Chrome if available.
4. Confirm no page-level horizontal overflow.
5. Confirm board and hand scrolling are usable.
6. Confirm tap targets are comfortable.

## Final Pass

1. Confirm realtime/polling updates the board and current turn within a couple seconds.
2. Confirm no hidden-hand data appears in UI or logs.
3. Capture screenshots of lobby, table room, game room, round complete, and game over.
4. Record deploy URL, commit SHA, browser, device, and test account notes.
