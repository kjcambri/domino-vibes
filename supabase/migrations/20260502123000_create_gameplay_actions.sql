create table if not exists public.game_moves (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  round_number integer not null default 1,
  move_number integer not null,
  move_type text not null,
  tile jsonb null,
  side text null,
  board_state_after jsonb null,
  created_at timestamptz not null default now(),
  constraint game_moves_move_type_check check (move_type in ('play', 'pass')),
  constraint game_moves_side_check check (
    side is null or side in ('start', 'left', 'right')
  ),
  constraint game_moves_game_move_number_unique unique (game_id, move_number)
);

create index if not exists game_moves_game_id_idx on public.game_moves(game_id);
create index if not exists game_moves_player_id_idx on public.game_moves(player_id);
create index if not exists game_moves_created_at_idx on public.game_moves(created_at);

alter table public.game_moves enable row level security;

drop policy if exists "Game participants can read game moves" on public.game_moves;
create policy "Game participants can read game moves"
  on public.game_moves
  for select
  to authenticated
  using (public.user_is_game_participant(game_id, auth.uid()));

grant select on public.game_moves to authenticated;

create or replace function public.domino_hand_pip_total(p_tiles jsonb)
returns integer
language sql
stable
as $$
  select coalesce(sum((tile.value ->> 'pipTotal')::integer), 0)::integer
  from jsonb_array_elements(coalesce(p_tiles, '[]'::jsonb)) as tile(value);
$$;

create or replace function public.domino_hand_has_legal_move(
  p_tiles jsonb,
  p_board_state jsonb
)
returns boolean
language sql
stable
as $$
  with board as (
    select
      coalesce(jsonb_array_length(coalesce(p_board_state -> 'placements', '[]'::jsonb)), 0) as placement_count,
      (p_board_state #>> '{openEnds,left}')::integer as open_left,
      (p_board_state #>> '{openEnds,right}')::integer as open_right
  )
  select case
    when board.placement_count = 0 then
      jsonb_array_length(coalesce(p_tiles, '[]'::jsonb)) > 0
    else exists (
      select 1
      from jsonb_array_elements(coalesce(p_tiles, '[]'::jsonb)) as tile(value)
      where (tile.value ->> 'left')::integer in (board.open_left, board.open_right)
         or (tile.value ->> 'right')::integer in (board.open_left, board.open_right)
    )
  end
  from board;
$$;

create or replace function public.domino_next_turn_player_id(
  p_game_id uuid,
  p_current_player_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  with current_player as (
    select gp.turn_order
    from public.game_players gp
    where gp.game_id = p_game_id
      and gp.player_id = p_current_player_id
  )
  select gp.player_id
  from public.game_players gp
  cross join current_player cp
  where gp.game_id = p_game_id
  order by
    case when gp.turn_order > cp.turn_order then 0 else 1 end,
    gp.turn_order
  limit 1;
$$;

create or replace function public.domino_blocked_winner(p_game_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select gp.player_id
  from public.game_players gp
  left join public.game_player_hands gph
    on gph.game_id = gp.game_id
   and gph.player_id = gp.player_id
  where gp.game_id = p_game_id
  order by
    public.domino_hand_pip_total(coalesce(gph.tiles, '[]'::jsonb)),
    jsonb_array_length(coalesce(gph.tiles, '[]'::jsonb)),
    gp.turn_order
  limit 1;
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
  if p_ended_reason not in ('player_went_out', 'blocked') then
    raise exception 'invalid_round_end_reason';
  end if;

  with player_scores as (
    select
      gp.id,
      case
        when gp.player_id = p_winner_player_id then 0
        else public.domino_hand_pip_total(coalesce(gph.tiles, '[]'::jsonb))
      end as round_score
    from public.game_players gp
    left join public.game_player_hands gph
      on gph.game_id = gp.game_id
     and gph.player_id = gp.player_id
    where gp.game_id = p_game_id
  )
  update public.game_players gp
  set
    round_score = ps.round_score,
    score = gp.score + ps.round_score
  from player_scores ps
  where gp.id = ps.id;

  update public.games g
  set
    status = 'round_finished',
    current_turn_player_id = null,
    board_state = coalesce(p_board_state, g.board_state) || jsonb_build_object(
      'roundWinnerPlayerId', p_winner_player_id,
      'endedReason', p_ended_reason
    )
  where g.id = p_game_id;
end;
$$;

revoke all on function public.domino_hand_pip_total(jsonb) from public;
revoke all on function public.domino_hand_has_legal_move(jsonb, jsonb) from public;
revoke all on function public.domino_next_turn_player_id(uuid, uuid) from public;
revoke all on function public.domino_blocked_winner(uuid) from public;
revoke all on function public.domino_finish_round(uuid, uuid, text, jsonb) from public;

create or replace function public.play_tile(
  p_game_id uuid,
  p_tile_id text,
  p_side text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_game public.games%rowtype;
  v_player public.game_players%rowtype;
  v_hand public.game_player_hands%rowtype;
  v_tile jsonb;
  v_side text := lower(trim(coalesce(p_side, '')));
  v_board jsonb;
  v_placements jsonb;
  v_placement_count integer;
  v_open_left integer;
  v_open_right integer;
  v_tile_left integer;
  v_tile_right integer;
  v_left_value integer;
  v_right_value integer;
  v_new_open_left integer;
  v_new_open_right integer;
  v_placement jsonb;
  v_new_board jsonb;
  v_new_tiles jsonb;
  v_remaining_tiles integer;
  v_move_number integer;
  v_next_player_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not public.user_has_profile(v_user_id) then
    raise exception 'profile_required';
  end if;

  if v_side not in ('start', 'left', 'right') then
    raise exception 'invalid_side';
  end if;

  select g.*
  into v_game
  from public.games g
  where g.id = p_game_id
  for update;

  if not found then
    raise exception 'game_not_found';
  end if;

  if v_game.status <> 'active' then
    raise exception 'game_not_active';
  end if;

  if v_game.current_turn_player_id is distinct from v_user_id then
    raise exception 'not_your_turn';
  end if;

  select gp.*
  into v_player
  from public.game_players gp
  where gp.game_id = p_game_id
    and gp.player_id = v_user_id;

  if not found then
    raise exception 'not_seated';
  end if;

  select gph.*
  into v_hand
  from public.game_player_hands gph
  where gph.game_id = p_game_id
    and gph.player_id = v_user_id
  for update;

  if not found then
    raise exception 'hand_not_found';
  end if;

  select tile.value
  into v_tile
  from jsonb_array_elements(v_hand.tiles) as tile(value)
  where tile.value ->> 'id' = p_tile_id
  limit 1;

  if v_tile is null then
    raise exception 'tile_not_owned';
  end if;

  v_board := case
    when v_game.board_state = '{}'::jsonb then jsonb_build_object(
      'placements', '[]'::jsonb,
      'openEnds', jsonb_build_object('left', null, 'right', null)
    )
    else v_game.board_state
  end;
  v_placements := coalesce(v_board -> 'placements', '[]'::jsonb);
  v_placement_count := jsonb_array_length(v_placements);
  v_open_left := (v_board #>> '{openEnds,left}')::integer;
  v_open_right := (v_board #>> '{openEnds,right}')::integer;
  v_tile_left := (v_tile ->> 'left')::integer;
  v_tile_right := (v_tile ->> 'right')::integer;

  if v_placement_count = 0 and v_side <> 'start' then
    raise exception 'first_tile_must_start';
  end if;

  if v_placement_count > 0 and v_side = 'start' then
    raise exception 'start_side_unavailable';
  end if;

  if v_placement_count = 0 then
    v_left_value := v_tile_left;
    v_right_value := v_tile_right;
    v_new_open_left := v_tile_left;
    v_new_open_right := v_tile_right;
  elsif v_side = 'left' then
    if v_tile_right = v_open_left then
      v_left_value := v_tile_left;
      v_right_value := v_tile_right;
      v_new_open_left := v_tile_left;
      v_new_open_right := v_open_right;
    elsif v_tile_left = v_open_left then
      v_left_value := v_tile_right;
      v_right_value := v_tile_left;
      v_new_open_left := v_tile_right;
      v_new_open_right := v_open_right;
    else
      raise exception 'illegal_move';
    end if;
  elsif v_side = 'right' then
    if v_tile_left = v_open_right then
      v_left_value := v_tile_left;
      v_right_value := v_tile_right;
      v_new_open_left := v_open_left;
      v_new_open_right := v_tile_right;
    elsif v_tile_right = v_open_right then
      v_left_value := v_tile_right;
      v_right_value := v_tile_left;
      v_new_open_left := v_open_left;
      v_new_open_right := v_tile_left;
    else
      raise exception 'illegal_move';
    end if;
  end if;

  select coalesce(max(gm.move_number), 0) + 1
  into v_move_number
  from public.game_moves gm
  where gm.game_id = p_game_id;

  v_placement := jsonb_build_object(
    'tile', v_tile,
    'playedBy', v_user_id,
    'side', v_side,
    'leftValue', v_left_value,
    'rightValue', v_right_value,
    'turnNumber', v_move_number
  );

  v_new_board := jsonb_build_object(
    'placements', case
      when v_placement_count = 0 then jsonb_build_array(v_placement)
      when v_side = 'left' then jsonb_build_array(v_placement) || v_placements
      else v_placements || jsonb_build_array(v_placement)
    end,
    'openEnds', jsonb_build_object(
      'left', v_new_open_left,
      'right', v_new_open_right
    )
  );

  select coalesce(jsonb_agg(tile.value order by tile.ordinality), '[]'::jsonb)
  into v_new_tiles
  from jsonb_array_elements(v_hand.tiles) with ordinality as tile(value, ordinality)
  where tile.value ->> 'id' <> p_tile_id;

  update public.game_player_hands gph
  set tiles = v_new_tiles
  where gph.game_id = p_game_id
    and gph.player_id = v_user_id;

  v_remaining_tiles := jsonb_array_length(v_new_tiles);

  update public.game_players gp
  set
    has_passed = false,
    last_seen_at = now()
  where gp.game_id = p_game_id
    and gp.player_id = v_user_id;

  insert into public.game_moves (
    game_id,
    player_id,
    round_number,
    move_number,
    move_type,
    tile,
    side,
    board_state_after
  )
  values (
    p_game_id,
    v_user_id,
    v_game.current_round_number,
    v_move_number,
    'play',
    v_tile,
    v_side,
    v_new_board
  );

  if v_remaining_tiles = 0 then
    perform public.domino_finish_round(
      p_game_id,
      v_user_id,
      'player_went_out',
      v_new_board
    );
  else
    v_next_player_id := public.domino_next_turn_player_id(p_game_id, v_user_id);

    update public.games g
    set
      board_state = v_new_board,
      current_turn_player_id = v_next_player_id
    where g.id = p_game_id;
  end if;

  return public.get_game_room(p_game_id);
end;
$$;

create or replace function public.pass_turn(p_game_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_game public.games%rowtype;
  v_player public.game_players%rowtype;
  v_hand public.game_player_hands%rowtype;
  v_move_number integer;
  v_next_player_id uuid;
  v_player_count integer;
  v_consecutive_passes integer;
  v_blocked_winner_player_id uuid;
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

  if v_game.status <> 'active' then
    raise exception 'game_not_active';
  end if;

  if v_game.current_turn_player_id is distinct from v_user_id then
    raise exception 'not_your_turn';
  end if;

  select gp.*
  into v_player
  from public.game_players gp
  where gp.game_id = p_game_id
    and gp.player_id = v_user_id;

  if not found then
    raise exception 'not_seated';
  end if;

  select gph.*
  into v_hand
  from public.game_player_hands gph
  where gph.game_id = p_game_id
    and gph.player_id = v_user_id
  for update;

  if not found then
    raise exception 'hand_not_found';
  end if;

  if public.domino_hand_has_legal_move(v_hand.tiles, v_game.board_state) then
    raise exception 'legal_move_available';
  end if;

  select coalesce(max(gm.move_number), 0) + 1
  into v_move_number
  from public.game_moves gm
  where gm.game_id = p_game_id;

  insert into public.game_moves (
    game_id,
    player_id,
    round_number,
    move_number,
    move_type,
    tile,
    side,
    board_state_after
  )
  values (
    p_game_id,
    v_user_id,
    v_game.current_round_number,
    v_move_number,
    'pass',
    null,
    null,
    v_game.board_state
  );

  update public.game_players gp
  set
    has_passed = true,
    last_seen_at = now()
  where gp.game_id = p_game_id
    and gp.player_id = v_user_id;

  select count(*)::integer
  into v_player_count
  from public.game_players gp
  where gp.game_id = p_game_id;

  with reversed_moves as (
    select
      gm.move_type,
      row_number() over (order by gm.move_number desc) as reverse_order
    from public.game_moves gm
    where gm.game_id = p_game_id
  ),
  first_play as (
    select min(reverse_order) as reverse_order
    from reversed_moves
    where move_type = 'play'
  )
  select count(*)::integer
  into v_consecutive_passes
  from reversed_moves rm
  cross join first_play fp
  where rm.move_type = 'pass'
    and (fp.reverse_order is null or rm.reverse_order < fp.reverse_order);

  if v_consecutive_passes >= v_player_count then
    v_blocked_winner_player_id := public.domino_blocked_winner(p_game_id);

    perform public.domino_finish_round(
      p_game_id,
      v_blocked_winner_player_id,
      'blocked',
      v_game.board_state
    );
  else
    v_next_player_id := public.domino_next_turn_player_id(p_game_id, v_user_id);

    update public.games g
    set current_turn_player_id = v_next_player_id
    where g.id = p_game_id;
  end if;

  return public.get_game_room(p_game_id);
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
  from public.games g
  where g.id = p_game_id;

  if not found then
    raise exception 'game_not_found';
  end if;

  if not exists (
    select 1
    from public.game_players gp
    where gp.game_id = p_game_id
      and gp.player_id = v_user_id
  ) then
    raise exception 'not_seated';
  end if;

  select gt.*
  into v_table
  from public.game_tables gt
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
  from public.game_players gp
  left join public.profiles p on p.id = gp.player_id
  left join public.game_player_hands gph
    on gph.game_id = gp.game_id
   and gph.player_id = gp.player_id
  where gp.game_id = p_game_id;

  select jsonb_build_object(
    'playerId', gp.player_id,
    'seatNumber', gp.seat_number,
    'turnOrder', gp.turn_order
  )
  into v_my_player
  from public.game_players gp
  where gp.game_id = p_game_id
    and gp.player_id = v_user_id;

  select count(*)::integer
  into v_move_count
  from public.game_moves gm
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
  from public.game_moves gm
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
      'endedReason', v_game.board_state ->> 'endedReason',
      'createdAt', v_game.created_at,
      'startedAt', v_game.started_at
    ),
    'players', v_players,
    'currentUser', v_my_player
  );
end;
$$;

revoke all on function public.play_tile(uuid, text, text) from public;
revoke all on function public.pass_turn(uuid) from public;
revoke all on function public.get_game_room(uuid) from public;

grant execute on function public.play_tile(uuid, text, text) to authenticated;
grant execute on function public.pass_turn(uuid) to authenticated;
grant execute on function public.get_game_room(uuid) to authenticated;

alter table public.game_moves replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.game_moves;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;
