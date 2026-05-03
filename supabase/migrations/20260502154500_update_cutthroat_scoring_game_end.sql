-- Sprint 11: Cutthroat 4 round-win scoring and game-end rules.
-- Round winner receives 1 point. First to 6 wins only while at least one
-- player remains at 0; if all players score at least once, the game ends
-- with no winner.

alter table public.games
  add column if not exists winner_player_id uuid references auth.users(id) on delete set null;

alter table public.games
  add column if not exists ended_reason text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'games_ended_reason_check'
      and conrelid = 'public.games'::regclass
  ) then
    alter table public.games
      add constraint games_ended_reason_check
      check (
        ended_reason is null
        or ended_reason in ('player_reached_6', 'all_players_scored', 'cancelled')
      );
  end if;
end $$;

create or replace function public.domino_apply_cutthroat_round_result(
  p_game_id uuid,
  p_round_winner_player_id uuid,
  p_round_end_reason text,
  p_board_state jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_status text := 'round_finished';
  v_game_winner_player_id uuid := null;
  v_game_ended_reason text := null;
  v_player_count integer;
begin
  if p_round_end_reason not in ('player_went_out', 'blocked') then
    raise exception 'invalid_round_end_reason';
  end if;

  if not exists (
    select 1
    from public.game_players as gp
    where gp.game_id = p_game_id
      and gp.player_id = p_round_winner_player_id
  ) then
    raise exception 'round_winner_not_found';
  end if;

  update public.game_players as gp
  set round_score = case
        when gp.player_id = p_round_winner_player_id then 1
        else 0
      end,
      score = gp.score + case
        when gp.player_id = p_round_winner_player_id then 1
        else 0
      end,
      updated_at = now()
  where gp.game_id = p_game_id;

  select count(*)::integer
  into v_player_count
  from public.game_players as gp
  where gp.game_id = p_game_id;

  if exists (
    select 1
    from public.game_players as gp
    where gp.game_id = p_game_id
      and gp.score >= 6
  ) and exists (
    select 1
    from public.game_players as gp
    where gp.game_id = p_game_id
      and gp.score = 0
  ) then
    select gp.player_id
    into v_game_winner_player_id
    from public.game_players as gp
    where gp.game_id = p_game_id
      and gp.score >= 6
    order by gp.score desc, gp.turn_order asc
    limit 1;

    v_game_status := 'finished';
    v_game_ended_reason := 'player_reached_6';
  elsif v_player_count = 4 and not exists (
    select 1
    from public.game_players as gp
    where gp.game_id = p_game_id
      and gp.score <= 0
  ) then
    v_game_status := 'finished';
    v_game_ended_reason := 'all_players_scored';
  end if;

  update public.games as g
  set status = v_game_status,
      current_turn_player_id = null,
      board_state = coalesce(p_board_state, g.board_state) || jsonb_build_object(
        'roundWinnerPlayerId', p_round_winner_player_id,
        'endedReason', p_round_end_reason
      ),
      winner_player_id = v_game_winner_player_id,
      ended_reason = v_game_ended_reason,
      finished_at = case
        when v_game_status = 'finished' then now()
        else null
      end,
      updated_at = now()
  where g.id = p_game_id;

  return jsonb_build_object(
    'status', v_game_status,
    'winnerPlayerId', v_game_winner_player_id,
    'endedReason', v_game_ended_reason
  );
end;
$$;

create or replace function public.domino_finish_round(
  p_game_id uuid,
  p_winner_player_id uuid,
  p_ended_reason text,
  p_board_state jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.domino_apply_cutthroat_round_result(
    p_game_id,
    p_winner_player_id,
    p_ended_reason,
    p_board_state
  );
end;
$$;

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
  v_game_id uuid := p_game_id;
  v_game public.games%rowtype;
  v_table public.game_tables%rowtype;
  v_player_count integer;
  v_round_number integer;
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
  from public.games as g
  where g.id = v_game_id
  for update;

  if not found then
    raise exception 'game_not_found';
  end if;

  if v_game.status = 'finished'
    or v_game.winner_player_id is not null
    or (v_game.status = 'finished' and v_game.ended_reason is not null)
  then
    raise exception 'game_finished';
  end if;

  if v_game.status <> 'round_finished' then
    raise exception 'round_not_finished';
  end if;

  select gt.*
  into v_table
  from public.game_tables as gt
  where gt.id = v_game.table_id
  for update;

  if not found then
    raise exception 'table_not_found';
  end if;

  if v_table.status <> 'in_game' or v_table.current_game_id is distinct from v_game_id then
    raise exception 'table_not_in_game';
  end if;

  if not exists (
    select 1
    from public.game_players as gp
    where gp.game_id = v_game_id
      and gp.player_id = v_user_id
  ) then
    raise exception 'not_game_participant';
  end if;

  select count(*)::integer
  into v_player_count
  from public.game_players as gp
  where gp.game_id = v_game_id;

  if v_game.game_mode <> 'cutthroat_4' or v_player_count <> 4 then
    raise exception 'invalid_player_count';
  end if;

  v_round_number := v_game.current_round_number + 1;

  with tiles as (
    select
      lows.low as low,
      highs.high as high,
      jsonb_build_object(
        'id', lows.low::text || '-' || highs.high::text,
        'left', lows.low,
        'right', highs.high,
        'isDouble', lows.low = highs.high,
        'pipTotal', lows.low + highs.high
      ) as tile,
      random() as shuffle_order
    from generate_series(0, 6) as lows(low)
    cross join generate_series(0, 6) as highs(high)
    where lows.low <= highs.high
  ),
  shuffled_tiles as (
    select
      t.tile as tile,
      row_number() over (order by t.shuffle_order) as tile_index
    from tiles as t
  ),
  seated_players as (
    select
      gp.player_id as seated_player_id,
      gp.turn_order as seated_turn_order,
      row_number() over (order by gp.turn_order) as player_index
    from public.game_players as gp
    where gp.game_id = v_game_id
    order by gp.turn_order
  ),
  dealt_tiles as (
    select
      sp.seated_player_id as dealt_player_id,
      st.tile as dealt_tile,
      st.tile_index as dealt_tile_index
    from shuffled_tiles as st
    join seated_players as sp
      on ((st.tile_index - 1) % 4) + 1 = sp.player_index
  ),
  grouped_hands as (
    select
      dt.dealt_player_id as hand_player_id,
      jsonb_agg(dt.dealt_tile order by dt.dealt_tile_index) as hand_tiles
    from dealt_tiles as dt
    group by dt.dealt_player_id
  ),
  hand_rows as (
    insert into public.game_player_hands as gph (game_id, player_id, tiles)
    select
      v_game_id,
      gh.hand_player_id,
      gh.hand_tiles
    from grouped_hands as gh
    on conflict on constraint game_player_hands_game_player_unique
    do update
      set tiles = excluded.tiles,
          updated_at = now()
    returning
      gph.player_id as returned_player_id,
      gph.tiles as returned_tiles
  )
  select count(*)::integer
  into v_hand_count
  from hand_rows as hr
  where jsonb_array_length(hr.returned_tiles) = 7;

  if v_hand_count <> 4 then
    raise exception 'hand_reset_failed';
  end if;

  update public.game_players as gp
  set round_score = 0,
      has_passed = false,
      updated_at = now()
  where gp.game_id = v_game_id;

  with hand_stats as (
    select
      gp.player_id as hand_player_id,
      gp.turn_order as hand_turn_order,
      max((hand_tile.tile ->> 'left')::integer) filter (
        where (hand_tile.tile ->> 'isDouble')::boolean
      ) as highest_double,
      max((hand_tile.tile ->> 'pipTotal')::integer) as highest_total
    from public.game_players as gp
    join public.game_player_hands as gph
      on gph.game_id = gp.game_id
     and gph.player_id = gp.player_id
    cross join jsonb_array_elements(gph.tiles) as hand_tile(tile)
    where gp.game_id = v_game_id
    group by gp.player_id, gp.turn_order
  )
  select hs.hand_player_id
  into v_current_turn_player_id
  from hand_stats as hs
  order by
    case when hs.highest_double is null then 1 else 0 end,
    hs.highest_double desc nulls last,
    hs.highest_total desc,
    hs.hand_turn_order asc
  limit 1;

  if v_current_turn_player_id is null then
    raise exception 'turn_selection_failed';
  end if;

  update public.games as g
  set status = 'active',
      current_round_number = v_round_number,
      current_turn_player_id = v_current_turn_player_id,
      board_state = public.domino_create_initial_board_state(),
      winner_player_id = null,
      ended_reason = null,
      finished_at = null,
      updated_at = now()
  where g.id = v_game_id;

  return query
  select
    v_game_id as game_id,
    v_round_number as round_number,
    'active'::text as status,
    v_current_turn_player_id as current_turn_player_id;
end;
$$;

create or replace function public.get_game_room(p_game_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_game public.games%rowtype;
  v_table public.game_tables%rowtype;
  v_players jsonb;
  v_my_player jsonb;
  v_move_count integer;
  v_last_move jsonb;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select g.*
  into v_game
  from public.games as g
  where g.id = p_game_id;

  if not found then
    raise exception 'game_not_found';
  end if;

  if not exists (
    select 1
    from public.game_players as gp
    where gp.game_id = p_game_id
      and gp.player_id = v_user_id
  ) then
    raise exception 'not_seated';
  end if;

  select gt.*
  into v_table
  from public.game_tables as gt
  where gt.id = v_game.table_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'playerId', gp.player_id,
        'seatNumber', gp.seat_number,
        'turnOrder', gp.turn_order,
        'score', gp.score,
        'roundScore', gp.round_score,
        'hasPassed', gp.has_passed,
        'isConnected', gp.is_connected,
        'lastSeenAt', gp.last_seen_at,
        'handCount', coalesce(jsonb_array_length(gph.tiles), 0),
        'username', p.username,
        'displayName', p.display_name,
        'avatarUrl', p.avatar_url
      )
      order by gp.turn_order
    ),
    '[]'::jsonb
  )
  into v_players
  from public.game_players as gp
  left join public.profiles as p on p.id = gp.player_id
  left join public.game_player_hands as gph
    on gph.game_id = gp.game_id
   and gph.player_id = gp.player_id
  where gp.game_id = p_game_id;

  select jsonb_build_object(
    'playerId', gp.player_id,
    'seatNumber', gp.seat_number,
    'turnOrder', gp.turn_order
  )
  into v_my_player
  from public.game_players as gp
  where gp.game_id = p_game_id
    and gp.player_id = v_user_id;

  select count(*)::integer
  into v_move_count
  from public.game_moves as gm
  where gm.game_id = p_game_id;

  select jsonb_build_object(
    'id', gm.id,
    'gameId', gm.game_id,
    'playerId', gm.player_id,
    'roundNumber', gm.round_number,
    'moveNumber', gm.move_number,
    'moveType', gm.move_type,
    'tile', gm.tile,
    'side', gm.side,
    'createdAt', gm.created_at
  )
  into v_last_move
  from public.game_moves as gm
  where gm.game_id = p_game_id
  order by gm.move_number desc
  limit 1;

  return jsonb_build_object(
    'game', jsonb_build_object(
      'id', v_game.id,
      'tableId', v_game.table_id,
      'tableName', v_table.name,
      'gameMode', v_game.game_mode,
      'status', v_game.status,
      'currentRoundNumber', v_game.current_round_number,
      'currentTurnPlayerId', v_game.current_turn_player_id,
      'boardState', v_game.board_state,
      'moveCount', v_move_count,
      'lastMove', v_last_move,
      'roundWinnerPlayerId', v_game.board_state ->> 'roundWinnerPlayerId',
      'roundEndedReason', v_game.board_state ->> 'endedReason',
      'winnerPlayerId', v_game.winner_player_id,
      'endedReason', v_game.ended_reason,
      'createdAt', v_game.created_at,
      'startedAt', v_game.started_at,
      'finishedAt', v_game.finished_at
    ),
    'players', v_players,
    'currentUser', v_my_player
  );
end;
$$;

revoke all on function public.domino_apply_cutthroat_round_result(uuid, uuid, text, jsonb) from public;
revoke all on function public.domino_finish_round(uuid, uuid, text, jsonb) from public;
revoke all on function public.start_next_round(uuid) from public;
revoke all on function public.get_game_room(uuid) from public;

grant execute on function public.start_next_round(uuid) to authenticated;
grant execute on function public.get_game_room(uuid) to authenticated;
