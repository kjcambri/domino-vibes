-- Sprint 10: continue-game flow.
-- Starts a fresh round inside the same game while preserving total scores.

create or replace function public.start_next_round(p_game_id uuid)
returns table (
  game_id uuid,
  round_number integer,
  status text,
  current_turn_player_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_game public.games%rowtype;
  v_table public.game_tables%rowtype;
  v_player_count integer;
  v_new_round_number integer;
  v_current_turn_player_id uuid;
  v_hand_count integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not public.user_has_profile(v_user_id) then
    raise exception 'profile_required';
  end if;

  select g.*
  into v_game
  from public.games g
  where g.id = p_game_id
  for update;

  if not found then
    raise exception 'game_not_found';
  end if;

  if v_game.status <> 'round_finished' then
    raise exception 'round_not_finished';
  end if;

  select gt.*
  into v_table
  from public.game_tables gt
  where gt.id = v_game.table_id
  for update;

  if not found then
    raise exception 'table_not_found';
  end if;

  if v_table.status <> 'in_game' or v_table.current_game_id is distinct from p_game_id then
    raise exception 'table_not_in_game';
  end if;

  if not exists (
    select 1
    from public.game_players gp
    where gp.game_id = p_game_id
      and gp.player_id = v_user_id
  ) then
    raise exception 'not_game_participant';
  end if;

  select count(*)::integer
  into v_player_count
  from public.game_players gp
  where gp.game_id = p_game_id;

  if v_game.game_mode <> 'cutthroat_4' or v_player_count <> 4 then
    raise exception 'invalid_player_count';
  end if;

  v_new_round_number := v_game.current_round_number + 1;

  with tiles as (
    select
      low,
      high,
      jsonb_build_object(
        'id', low::text || '-' || high::text,
        'left', low,
        'right', high,
        'isDouble', low = high,
        'pipTotal', low + high
      ) as tile,
      random() as shuffle_order
    from generate_series(0, 6) as lows(low)
    cross join generate_series(0, 6) as highs(high)
    where low <= high
  ),
  shuffled_tiles as (
    select
      tile,
      row_number() over (order by shuffle_order) as tile_index
    from tiles
  ),
  seated_players as (
    select
      gp.player_id,
      gp.turn_order,
      row_number() over (order by gp.turn_order) as player_index
    from public.game_players gp
    where gp.game_id = p_game_id
    order by gp.turn_order
  ),
  dealt_tiles as (
    select
      sp.player_id,
      st.tile,
      st.tile_index
    from shuffled_tiles st
    join seated_players sp on ((st.tile_index - 1) % 4) + 1 = sp.player_index
  ),
  grouped_hands as (
    select
      dt.player_id,
      jsonb_agg(dt.tile order by dt.tile_index) as tiles
    from dealt_tiles dt
    group by dt.player_id
  ),
  hand_rows as (
    insert into public.game_player_hands (game_id, player_id, tiles)
    select
      p_game_id,
      gh.player_id,
      gh.tiles
    from grouped_hands gh
    on conflict (game_id, player_id)
    do update
      set tiles = excluded.tiles,
          updated_at = now()
    returning player_id, tiles
  )
  select count(*)::integer
  into v_hand_count
  from hand_rows
  where jsonb_array_length(tiles) = 7;

  if v_hand_count <> 4 then
    raise exception 'hand_reset_failed';
  end if;

  update public.game_players gp
  set round_score = 0,
      has_passed = false,
      updated_at = now()
  where gp.game_id = p_game_id;

  with hand_stats as (
    select
      gp.player_id,
      gp.turn_order,
      max((hand_tile.tile ->> 'left')::integer) filter (
        where (hand_tile.tile ->> 'isDouble')::boolean
      ) as highest_double,
      max((hand_tile.tile ->> 'pipTotal')::integer) as highest_total
    from public.game_players gp
    join public.game_player_hands gph
      on gph.game_id = gp.game_id
     and gph.player_id = gp.player_id
    cross join jsonb_array_elements(gph.tiles) as hand_tile(tile)
    where gp.game_id = p_game_id
    group by gp.player_id, gp.turn_order
  )
  select hs.player_id
  into v_current_turn_player_id
  from hand_stats hs
  order by
    case when hs.highest_double is null then 1 else 0 end,
    hs.highest_double desc nulls last,
    hs.highest_total desc,
    hs.turn_order asc
  limit 1;

  if v_current_turn_player_id is null then
    raise exception 'turn_selection_failed';
  end if;

  update public.games g
  set status = 'active',
      current_round_number = v_new_round_number,
      current_turn_player_id = v_current_turn_player_id,
      board_state = public.domino_create_initial_board_state(),
      updated_at = now()
  where g.id = p_game_id;

  return query
  select
    p_game_id,
    v_new_round_number,
    'active'::text,
    v_current_turn_player_id;
end;
$$;

revoke all on function public.start_next_round(uuid) from public;
grant execute on function public.start_next_round(uuid) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.game_player_hands;
exception
  when duplicate_object then null;
end $$;
