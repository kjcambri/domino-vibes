-- DEV ONLY: inspect Domino Vibes Cutthroat 4 scoring and game-end state.
-- Do not run this as a production migration.

-- 1) Pick a recent game.
select
  g.id as game_id,
  g.status,
  g.current_round_number,
  g.winner_player_id,
  g.ended_reason,
  g.finished_at,
  g.updated_at
from public.games g
order by g.updated_at desc
limit 10;

-- 2) Replace the id below with a game id from step 1.
-- \set game_id '00000000-0000-0000-0000-000000000000'

-- 3) View player scores. In Sprint 11, score means round-win points.
-- select
--   gp.player_id,
--   p.display_name,
--   gp.turn_order,
--   gp.round_score,
--   gp.score as total_points,
--   gp.hand_count
-- from (
--   select
--     gp.*,
--     coalesce(jsonb_array_length(gph.tiles), 0) as hand_count
--   from public.game_players gp
--   left join public.game_player_hands gph
--     on gph.game_id = gp.game_id
--    and gph.player_id = gp.player_id
--   where gp.game_id = :'game_id'::uuid
-- ) gp
-- left join public.profiles p on p.id = gp.player_id
-- order by gp.turn_order;

-- 4) Confirm the latest round winner got +1 and others got +0.
-- select
--   g.board_state ->> 'roundWinnerPlayerId' as round_winner_player_id,
--   g.board_state ->> 'endedReason' as round_end_reason,
--   gp.player_id,
--   gp.round_score,
--   gp.score as total_points
-- from public.games g
-- join public.game_players gp on gp.game_id = g.id
-- where g.id = :'game_id'::uuid
-- order by gp.turn_order;

-- 5) Check valid final-winner condition:
-- game.status = finished, ended_reason = player_reached_6,
-- winner_player_id is set, and at least one player still has 0 points.
-- select
--   g.id,
--   g.status,
--   g.winner_player_id,
--   g.ended_reason,
--   exists (
--     select 1
--     from public.game_players gp
--     where gp.game_id = g.id
--       and gp.score = 0
--   ) as has_zero_point_player
-- from public.games g
-- where g.id = :'game_id'::uuid;

-- 6) Check no-winner condition:
-- game.status = finished, ended_reason = all_players_scored,
-- winner_player_id is null, and every player has score > 0.
-- select
--   g.id,
--   g.status,
--   g.winner_player_id,
--   g.ended_reason,
--   not exists (
--     select 1
--     from public.game_players gp
--     where gp.game_id = g.id
--       and gp.score <= 0
--   ) as all_players_have_points
-- from public.games g
-- where g.id = :'game_id'::uuid;
