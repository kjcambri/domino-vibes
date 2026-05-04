# Domino Vibes Private Beta QA Checklist

Use this checklist before inviting private testers and before every beta deploy. Test with throwaway accounts only.

## 1. Environment Setup

- Confirm local dev runs with `npm run dev`.
- Confirm `.env.local` points to the intended Supabase project.
- Confirm required env vars are present: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Confirm the Supabase project has all migrations applied.
- Create at least four test users with completed profiles.
- Test in Chrome, Safari, Firefox, and at least one mobile browser.
- Keep Supabase SQL Editor open for dev-only cleanup scripts.

## 2. Auth/Profile Testing

- Sign up with a new test email.
- Confirm email verification behavior if Supabase email confirmation is enabled.
- Log in with a valid test account.
- Log out and confirm protected routes redirect correctly.
- Visit protected routes while logged out.
- Create a profile with valid display name and username.
- Try duplicate username and confirm friendly error.
- Try invalid or empty profile form states.
- Confirm profile page loads after setup.

## 3. Lobby Testing

- Confirm lobby tables load.
- Join a waiting table.
- Confirm current table banner appears.
- Rejoin a waiting table from the banner.
- Start a game, return to lobby, and confirm the banner becomes Rejoin Game.
- Confirm full tables cannot be joined.
- Confirm the active game table shows in-game status.
- Finish a game, return to lobby with every player, and confirm the table resets to waiting.
- Confirm stale or old test data can be cleared with dev SQL.

## 4. Table Room Testing

- Select each open seat.
- Confirm occupied seats cannot be taken.
- Leave a waiting table.
- Ready and unready as the current user.
- Confirm ready count updates for all users.
- Confirm active/away status appears for seated players.
- Confirm Start Game is disabled until 4 seats are filled and ready.
- Start game and confirm the route changes to `/games/:gameId`.
- Confirm stale waiting seats can be cleaned with dev cleanup.

## 5. Game Room Testing

- Confirm the current user's secure hand loads.
- Confirm opponents show hand counts only.
- Play the first tile with Play Start.
- Play legal left and right moves.
- Try an illegal move and confirm it is rejected.
- Pass when blocked.
- Try to pass while a legal move exists and confirm it is rejected.
- Confirm current turn updates for all sessions.
- Confirm board geometry persists after refresh.
- Confirm doubles render crosswise and connected.
- Refresh and rejoin the active game.
- Confirm active/away status updates.
- Finish a round by going out.
- Finish a blocked round.
- Start next round and confirm hands reset to 7 tiles.
- Confirm total scores persist across rounds.
- Finish a game and confirm Game Over panel.
- Return to lobby and confirm finished seats clear.

## 6. Multi-Browser Testing

- Run a 2-browser simulation with two users and observe realtime/polling updates.
- Run a full 4-player game with four separate users.
- Use incognito/private windows to isolate sessions.
- Record browser, device, and OS for every issue.
- Capture screenshots of broken board, turn, or hand states.

## 7. Mobile Testing

- Test iPhone Safari around 390px width.
- Test iPhone Chrome.
- Test Android Chrome.
- Confirm no page-level horizontal overflow.
- Confirm board internal scrolling is usable.
- Confirm hand tray horizontal scrolling is easy.
- Confirm tap targets are comfortable.
- Confirm action buttons are reachable with thumbs.
- Confirm text does not overlap or clip.

## 8. Security Testing

- Confirm hidden hands are never returned by `get_game_room`.
- Confirm `get_my_hand` returns only the authenticated player's hand.
- Confirm a non-participant cannot load a game hand.
- Confirm a non-participant cannot play or pass.
- Confirm a player cannot play out of turn.
- Confirm a player cannot play a tile they do not own.
- Confirm users cannot sit in occupied seats.
- Confirm users cannot start next round unless the round is finished and they are participants.
- Confirm users cannot clear someone else's finished-game seat.
- Confirm frontend code does not directly write hands, moves, or games tables.

## 9. Chat Testing

- Send and read a lobby chat message from two logged-in users.
- Confirm lobby chat blocks empty messages.
- Confirm lobby chat blocks messages longer than 500 characters.
- Join a table and send a table chat message.
- Confirm seated table users can read table chat.
- Confirm non-seated users cannot read or send table chat.
- Start a game and send a game chat message.
- Confirm game participants can read game chat.
- Confirm non-participants cannot read or send game chat.
- Confirm chat updates in another browser through realtime or polling.
- Confirm Enter sends and Shift+Enter does not unexpectedly submit if multiline behavior is active.
- Confirm chat does not expose hidden hands or gameplay RPC payloads.

## 10. Regression Checklist Before Every Commit

- Run `npm run lint`.
- Run `npm run build`.
- Run `npm run test:run`.
- Run `git diff --check`.
- Confirm no Supabase migrations were changed unless the task required it.
- Confirm hidden-hand data is not logged or rendered.
- Confirm the current route still loads in the browser.
- Check mobile width for the changed screen.

## 11. Known Issues

- Vite can warn about large chunks if route splitting regresses.
- Private beta should use test accounts and test data only.
- Old games created before server-saved geometry may not look like fresh games.
- Stuck development seats may require dev SQL cleanup.
- Chat is MVP only; advanced moderation, DMs, media uploads, bots, AFK takeover, ranked, and tournament support are not included yet.
