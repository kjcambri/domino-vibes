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

## 4. Private Table Testing

- Create a private table from the lobby Private Tables panel.
- Confirm the creator is automatically seated at seat 1.
- Confirm the private table does not appear in the public club table grid.
- Confirm the ready room shows a Private Table badge and invite code.
- Copy the invite code and join from a second logged-in account.
- Confirm invalid, short, or unknown invite codes show friendly errors.
- Confirm a user already seated at another active table cannot create or join a private table.
- Confirm private table chat works for seated private-table users.
- Confirm non-seated users cannot open the private table room by URL alone.
- Fill four seats, ready up, start the game, and confirm gameplay is unchanged.

## 5. Table Room Testing

- Select each open seat.
- Confirm occupied seats cannot be taken.
- Leave a waiting table.
- Ready and unready as the current user.
- Confirm ready count updates for all users.
- Confirm active/away status appears for seated players.
- Confirm Start Game is disabled until 4 seats are filled and ready.
- Start game and confirm the route changes to `/games/:gameId`.
- Confirm stale waiting seats can be cleaned with dev cleanup.

## 6. Game Room Testing

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

## 7. Multi-Browser Testing

- Run a 2-browser simulation with two users and observe realtime/polling updates.
- Run a full 4-player game with four separate users.
- Use incognito/private windows to isolate sessions.
- Record browser, device, and OS for every issue.
- Capture screenshots of broken board, turn, or hand states.

## 8. Mobile Testing

- Test iPhone Safari around 390px width.
- Test iPhone Chrome.
- Test Android Chrome.
- Confirm no page-level horizontal overflow.
- Confirm board internal scrolling is usable.
- Confirm hand tray horizontal scrolling is easy.
- Confirm tap targets are comfortable.
- Confirm action buttons are reachable with thumbs.
- Confirm text does not overlap or clip.

## 9. Asset and Game-Feel Testing

- Run `npm run assets:audit` and confirm all 28 tile fronts plus `domino-back` exist.
- Confirm no `.DS_Store`, `__MACOSX/`, or `._filename.png` metadata files are present.
- Confirm large PNG warnings are expected source-asset warnings, not missing assets.
- Run `npm run assets:import-real` after updating `~/Desktop/Real Domino Assets` and confirm `public/assets/dominoes-real-webp/` contains 29 files.
- Run `npm run assets:contact-sheet-real` and review `public/assets/dominoes-real-contact-sheet.png`.
- Confirm real assets are exported on a consistent 320x640 WebP canvas.
- Confirm every tile value is correct and uses low-on-top/high-on-bottom orientation.
- Confirm `domino-back` exists and looks acceptable for hidden/opponent tiles.
- If WebP copies are regenerated, confirm `public/assets/dominoes-webp/` contains 29 files.
- Run `npm run assets:normalize` when evaluating photo-asset cleanup and confirm `public/assets/dominoes-normalized-webp/` contains 29 files.
- Run `npm run assets:contact-sheet` and review `public/assets/dominoes-normalized-contact-sheet.png` for crooked tiles, gray halos, inconsistent crops, and inconsistent padding.
- Confirm domino images load in the hand tray and on the board.
- Confirm board tiles use the Sprint 22 real WebP assets by default.
- Confirm hand/rack tiles use the Sprint 22 real WebP assets by default.
- Confirm homepage fallback and live mini-board previews use the Sprint 22 real WebP assets.
- Confirm hand/rack tiles are not overly dark, blurry, or trapped inside heavy dark cards.
- Confirm hand/rack tiles visually match the board tile brightness and crop style.
- Temporarily break one local tile path in development only and confirm the text fallback remains fixed-size.
- Confirm selected hand tiles lift/glow clearly.
- Confirm disabled or round-ended hand tiles remain readable and only subtly muted.
- Confirm latest move highlight is visible without overpowering the board.
- Confirm start tile marker is subtle and readable.
- Check doubles, blank `0` halves, and high-pip tiles for readability at board size and hand size.
- Confirm open-end chips do not take focus away from the board.
- Confirm board felt/wood styling stays usable on mobile and desktop.
- Confirm mobile hand tray horizontal scrolling remains smooth after tile style changes.
- Confirm current assets are acceptable for beta, while production-quality consistent assets remain future work.

## 10. Security Testing

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
- Confirm private `game_tables` rows are readable only by seated users/creator through RLS.
- Confirm `join_table` cannot join a private table by table id alone.
- Confirm `join_private_table` requires a valid invite code and authenticated profile.

## 11. Chat Testing

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

## 12. Regression Checklist Before Every Commit

- Run `npm run lint`.
- Run `npm run build`.
- Run `npm run test:run`.
- Run `git diff --check`.
- Run `npm run assets:audit` after touching domino assets or asset scripts.
- Confirm no Supabase migrations were changed unless the task required it.
- Confirm hidden-hand data is not logged or rendered.
- Confirm the current route still loads in the browser.
- Check mobile width for the changed screen.

## 13. Known Issues

- Vite can warn about large chunks if route splitting regresses.
- Private beta should use test accounts and test data only.
- Old games created before server-saved geometry may not look like fresh games.
- Stuck development seats may require dev SQL cleanup.
- Chat is MVP only; advanced moderation, DMs, media uploads, bots, AFK takeover, ranked, and tournament support are not included yet.
- Private Tables are invite-code MVP rooms only; no host controls, room passwords, or custom table settings yet.
- Current domino artwork is beta-ready, but a fully consistent production asset set is still recommended.
