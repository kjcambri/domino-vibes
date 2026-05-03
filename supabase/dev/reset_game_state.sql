-- DEV ONLY: resets all table/game state so you can start fresh.
-- Do not run this in production after real users exist.
-- This script is intentionally outside supabase/migrations so it does not run automatically.

begin;

delete from public.game_moves;
delete from public.game_player_hands;
delete from public.game_players;
delete from public.games;

update public.table_seats
set
  player_id = null,
  is_ready = false,
  joined_at = null,
  updated_at = now();

update public.game_tables
set
  status = 'waiting',
  current_game_id = null,
  updated_at = now();

commit;

-- OPTIONAL DEV ONLY: reset one table instead of all tables.
-- Replace the UUID below with the target game_tables.id, then run this block by itself.
--
-- begin;
--
-- delete from public.game_moves gm
-- using public.games g
-- where gm.game_id = g.id
--   and g.table_id = '00000000-0000-0000-0000-000000000000';
--
-- delete from public.game_player_hands gph
-- using public.games g
-- where gph.game_id = g.id
--   and g.table_id = '00000000-0000-0000-0000-000000000000';
--
-- delete from public.game_players gp
-- using public.games g
-- where gp.game_id = g.id
--   and g.table_id = '00000000-0000-0000-0000-000000000000';
--
-- delete from public.games
-- where table_id = '00000000-0000-0000-0000-000000000000';
--
-- update public.table_seats
-- set
--   player_id = null,
--   is_ready = false,
--   joined_at = null,
--   updated_at = now()
-- where table_id = '00000000-0000-0000-0000-000000000000';
--
-- update public.game_tables
-- set
--   status = 'waiting',
--   current_game_id = null,
--   updated_at = now()
-- where id = '00000000-0000-0000-0000-000000000000';
--
-- commit;
