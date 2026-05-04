# Domino Vibes Manual Smoke Test Script

Run this script after every beta deploy. Capture screenshots for any failure.

## Setup

- Use four test accounts with completed profiles.
- Open four browser sessions or profiles.
- Use the same Supabase project as the deployed app.

## Script

1. Open the deployed app.
   - Expected: Landing page loads with no console errors that block use.

2. Log in as Player A.
   - Expected: Lobby is reachable.

3. Join a waiting table.
   - Expected: Player A appears seated in Table Room.

4. Log in as Players B, C, and D in separate sessions.
   - Expected: Each can join an open seat at the same table.

5. Ready all four players.
   - Expected: Ready count reaches 4/4 and Start Game enables.

6. Start the game.
   - Expected: All players route or can rejoin to `/games/:gameId`.

7. Verify hands.
   - Expected: Each player sees exactly 7 own tiles. Opponents show counts only.

8. Play the first tile.
   - Expected: Board updates, hand count decreases, current turn advances.

9. Play one left or right move from the next player.
   - Expected: Other sessions update within polling interval without refresh.

10. Attempt an invalid pass when a legal tile exists.
    - Expected: Server rejects with a friendly message.

11. Refresh a game tab.
    - Expected: Game room reloads, own hand appears, hidden hands remain hidden.

12. Close one tab for 45-60 seconds.
    - Expected: That player eventually shows away/disconnected.

13. Finish a round if practical.
    - Expected: Round Complete appears and the winner gets +1 point.

14. Start the next round.
    - Expected: Board resets, round number increments, hands return to 7 tiles.

15. Finish or use dev cleanup.
    - Expected: Finished game Return to Lobby releases seats.

## Screenshot Checklist

- Lobby table list.
- Table room with four ready players.
- Game room with board and hand tray.
- Round Complete panel.
- Game Over panel if reached.
- Any error state.

## Bug Report Template

- Browser and version:
- Device:
- User/session:
- Route:
- Steps:
- Expected:
- Actual:
- Screenshot:
- Console error:
