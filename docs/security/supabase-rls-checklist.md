# Supabase RLS and Hidden-Hand Verification Checklist

Use this checklist against the Supabase project that powers the beta environment.

## Profiles

- Confirm users can read their own profile.
- Confirm profile creation requires authentication.
- Confirm duplicate usernames are rejected.
- Confirm users cannot update another user's profile.

## Game Tables

- Confirm lobby/table reads expose public table state only.
- Confirm private table rows are not visible to users who are not the creator or seated at that private table.
- Confirm private table invite codes are not exposed through the public lobby table list.
- Confirm direct unsafe writes to `game_tables` are blocked from the frontend.
- Confirm table status changes happen through RPCs.
- Confirm `create_private_table` sets `created_by = auth.uid()` and generates the invite code server-side.
- Confirm `join_private_table` uses the invite code and `auth.uid()` instead of trusting client-supplied user ids.

## Table Seats

- Confirm users cannot directly take occupied seats.
- Confirm users cannot directly clear another user's seat.
- Confirm `sit_at_table`, `leave_table`, and `leave_finished_game` use `auth.uid()`.
- Confirm non-seated users cannot read private table seats through direct table access.
- Confirm stale waiting-seat cleanup does not affect active `in_game` tables.

## Games

- Confirm participants can read the game room public state.
- Confirm non-participants cannot access private game actions.
- Confirm game status transitions happen through RPCs.

## Game Players

- Confirm game participants can read public player rows for that game.
- Confirm direct frontend insert/update/delete is blocked.
- Confirm presence updates only affect the authenticated player's row.

## Game Player Hands

- Confirm `game_player_hands` RLS allows a user to read only their own hand row.
- Confirm no frontend code selects all hand rows for a game.
- Confirm `get_game_room` returns hand counts only.
- Confirm `get_my_hand` returns only the authenticated user's tiles.
- Confirm logs never print `tiles` arrays or full hand payloads.

## Homepage Live Match Preview

- Confirm `get_featured_live_game_preview` returns only one active public preview or `null`.
- Confirm the preview payload includes board placements, open ends, table/mode status, move count, points, display names, seats, scores, and hand counts only.
- Confirm the preview RPC does not return player ids or any hand tile arrays.
- Confirm the preview RPC does not read from `game_player_hands`; hand counts are derived from current-round play moves.
- Confirm anonymous users can call the preview only because the function is `SECURITY DEFINER` and returns sanitized read-only data.
- Confirm finished, cancelled, setup, and abandoned games do not appear on the public homepage.

## Game Moves

- Confirm participants can read moves for their game.
- Confirm direct frontend insert/update/delete is blocked.
- Confirm moves are recorded only through `play_tile` and `pass_turn`.

## Chat Messages

- Confirm authenticated users can read lobby chat.
- Confirm lobby messages use `room_type = 'lobby'` and `room_id is null`.
- Confirm table chat read/send requires the user to be seated at that table.
- Confirm game chat read/send requires the user to be a participant in that game.
- Confirm `sender_id` must equal `auth.uid()`.
- Confirm normal users cannot set `is_system = true`.
- Confirm normal users cannot directly update or delete messages.
- Confirm `send_chat_message` controls `sender_display_name` from the profile row.
- Confirm empty and over-500-character messages are rejected server-side.
- Confirm chat logs do not include hidden hand data.

## RPC Security Checks

Each sensitive RPC should use `auth.uid()` and reject invalid users:

- `join_table`
- `join_private_table`
- `create_private_table`
- `sit_at_table`
- `leave_table`
- `start_game`
- `get_game_room`
- `get_my_hand`
- `play_tile`
- `pass_turn`
- `start_next_round`
- `leave_finished_game`
- `heartbeat_game_presence`
- `heartbeat_table_presence`
- `mark_stale_players`
- `send_chat_message`
- `get_chat_messages`
- `get_featured_live_game_preview`

## Hidden-Hand Risk Checklist

- Search frontend for `game_player_hands`.
- Search frontend for `tiles` usage outside `get_my_hand` and current-user hand rendering.
- Confirm opponent components render `hand_count` only.
- Confirm homepage preview renders derived hand counts only and never loads `get_my_hand`.
- Confirm debug logs sanitize `tiles`, `hand`, password, token, and secret-like keys.
- Confirm browser network tab never shows opponent tile arrays.

## Non-Participant Test

1. Create a fifth test user.
2. Log in as that user.
3. Try to open a game URL where the user is not a participant.
4. Try to call `get_my_hand` for that game.
5. Try to call `play_tile` for that game.
6. Expected: all private or mutating operations are rejected.
