-- DEV ONLY: inspect why start_next_round cannot run.
-- Paste selected statements into the Supabase SQL Editor for the same project
-- your app uses. Do not run this as a production migration.
-- If you saw SQLSTATE 42702 / "column reference game_id is ambiguous",
-- apply the latest fix_start_next_round_ambiguous_game_id migration first.
-- If you saw SQLSTATE 42883 / missing domino_create_initial_board_state,
-- apply the latest fix_missing_initial_board_state_helper migration first.

-- 1) Confirm the RPC exists.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'start_next_round';

-- 2) Confirm the board reset helper exists and returns the expected shape.
select public.domino_create_initial_board_state() as initial_board_state;

-- 3) Find recent games that are eligible for the next round.
select
  g.id as game_id,
  g.status as game_status,
  g.current_round_number,
  g.table_id,
  gt.status as table_status,
  gt.current_game_id,
  g.updated_at
from public.games g
join public.game_tables gt on gt.id = g.table_id
where g.status = 'round_finished'
order by g.updated_at desc
limit 10;

-- 4) Replace the id below with a round_finished game id from step 3.
-- \set game_id '00000000-0000-0000-0000-000000000000'

-- 5) Check the required game/table state.
-- select
--   g.id as game_id,
--   g.status as game_status,
--   g.game_mode,
--   g.current_round_number,
--   gt.status as table_status,
--   gt.current_game_id
-- from public.games g
-- join public.game_tables gt on gt.id = g.table_id
-- where g.id = :'game_id'::uuid;

-- 6) Check player and hand counts.
-- select count(*) as game_player_count
-- from public.game_players
-- where game_id = :'game_id'::uuid;

-- select
--   count(*) as hand_rows,
--   count(*) filter (where jsonb_array_length(tiles) = 7) as seven_tile_hands
-- from public.game_player_hands
-- where game_id = :'game_id'::uuid;

-- 7) Check participant profile state.
-- select
--   gp.player_id,
--   gp.seat_number,
--   gp.turn_order,
--   p.username,
--   p.display_name
-- from public.game_players gp
-- left join public.profiles p on p.id = gp.player_id
-- where gp.game_id = :'game_id'::uuid
-- order by gp.turn_order;

-- Note: calling start_next_round directly from SQL Editor usually fails with
-- not_authenticated because auth.uid() is tied to a request JWT. Test the RPC
-- through the app while logged in, or use an authenticated REST/RPC request.
