create or replace function public.domino_normalize_tile_id(p_tile_id text)
returns text
language sql
immutable
as $$
  with parts as (
    select
      split_part(trim(coalesce(p_tile_id, '')), '-', 1)::integer as left_pip,
      split_part(trim(coalesce(p_tile_id, '')), '-', 2)::integer as right_pip
    where trim(coalesce(p_tile_id, '')) ~ '^[0-6]-[0-6]$'
  )
  select case
    when left_pip is null then '0-0'
    when left_pip <= right_pip then left_pip::text || '-' || right_pip::text
    else right_pip::text || '-' || left_pip::text
  end
  from parts
  union all
  select '0-0'
  where not exists (select 1 from parts)
  limit 1;
$$;

create or replace function public.domino_tile_left(p_tile jsonb)
returns integer
language sql
immutable
as $$
  select (p_tile ->> 'left')::integer;
$$;

create or replace function public.domino_tile_right(p_tile jsonb)
returns integer
language sql
immutable
as $$
  select (p_tile ->> 'right')::integer;
$$;

create or replace function public.domino_tile_is_double(p_tile jsonb)
returns boolean
language sql
immutable
as $$
  select coalesce((p_tile ->> 'isDouble')::boolean, false);
$$;

create or replace function public.domino_opposite_pip(
  p_tile jsonb,
  p_connected_pip integer
)
returns integer
language sql
immutable
as $$
  select case
    when public.domino_tile_left(p_tile) = p_connected_pip then public.domino_tile_right(p_tile)
    when public.domino_tile_right(p_tile) = p_connected_pip then public.domino_tile_left(p_tile)
    else public.domino_tile_right(p_tile)
  end;
$$;

create or replace function public.domino_visual_bounds()
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'minX', -220,
    'maxX', 220,
    'minY', -120,
    'maxY', 260
  );
$$;

create or replace function public.domino_create_initial_board_state()
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'placements', '[]'::jsonb,
    'openEnds', jsonb_build_object('left', null, 'right', null),
    'visual', jsonb_build_object(
      'leftEndpoint', null,
      'rightEndpoint', null,
      'bounds', public.domino_visual_bounds()
    )
  );
$$;

create or replace function public.domino_create_initial_visual_state()
returns jsonb
language sql
immutable
as $$
  select public.domino_create_initial_board_state() -> 'visual';
$$;

create or replace function public.domino_ensure_visual_board_state(p_board_state jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  v_board jsonb;
  v_visual jsonb;
begin
  v_board := case
    when p_board_state is null or p_board_state = '{}'::jsonb then
      public.domino_create_initial_board_state()
    else
      p_board_state
  end;

  v_visual := coalesce(v_board -> 'visual', '{}'::jsonb);
  v_visual := jsonb_build_object(
    'leftEndpoint', coalesce(v_visual -> 'leftEndpoint', 'null'::jsonb),
    'rightEndpoint', coalesce(v_visual -> 'rightEndpoint', 'null'::jsonb),
    'bounds', coalesce(v_visual -> 'bounds', public.domino_visual_bounds())
  );

  return v_board || jsonb_build_object(
    'placements', coalesce(v_board -> 'placements', '[]'::jsonb),
    'openEnds', coalesce(
      v_board -> 'openEnds',
      jsonb_build_object('left', null, 'right', null)
    ),
    'visual', v_visual
  );
end;
$$;

create or replace function public.domino_visual_orientation(
  p_direction text,
  p_is_double boolean
)
returns text
language sql
immutable
as $$
  select case
    when coalesce(p_is_double, false) then
      case when p_direction in ('left', 'right') then 'vertical' else 'horizontal' end
    else
      case when p_direction in ('left', 'right') then 'horizontal' else 'vertical' end
  end;
$$;

create or replace function public.domino_visual_path_length(
  p_direction text,
  p_orientation text
)
returns numeric
language sql
immutable
as $$
  select case
    when p_direction in ('left', 'right') then
      case when p_orientation = 'horizontal' then 56 else 28 end
    else
      case when p_orientation = 'vertical' then 56 else 28 end
  end;
$$;

create or replace function public.domino_calculate_start_visual_placement(
  p_tile jsonb,
  p_player_id uuid,
  p_turn_number integer
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_is_double boolean := public.domino_tile_is_double(p_tile);
  v_orientation text;
  v_rotation integer;
begin
  v_orientation := case when v_is_double then 'vertical' else 'horizontal' end;
  v_rotation := case when v_is_double then 0 else 90 end;

  return jsonb_build_object(
    'tile', p_tile,
    'playedBy', p_player_id,
    'side', 'start',
    'leftValue', public.domino_tile_left(p_tile),
    'rightValue', public.domino_tile_right(p_tile),
    'turnNumber', p_turn_number,
    'x', 0,
    'y', 0,
    'rotation', v_rotation,
    'orientation', v_orientation,
    'direction', 'right',
    'connectedPip', null,
    'exposedPip', public.domino_tile_right(p_tile),
    'isDouble', v_is_double
  );
end;
$$;

create or replace function public.domino_fallback_visual_endpoint(
  p_board_state jsonb,
  p_side text
)
returns jsonb
language plpgsql
stable
as $$
declare
  v_pip integer;
begin
  v_pip := case
    when p_side = 'left' then (p_board_state #>> '{openEnds,left}')::integer
    else (p_board_state #>> '{openEnds,right}')::integer
  end;

  return jsonb_build_object(
    'x', case when p_side = 'left' then -28 else 28 end,
    'y', 0,
    'direction', case when p_side = 'left' then 'left' else 'right' end,
    'pip', v_pip,
    'row', 0,
    'runCount', 0
  );
end;
$$;

create or replace function public.domino_turn_visual_endpoint_if_needed(
  p_endpoint jsonb,
  p_tile jsonb
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_direction text := p_endpoint ->> 'direction';
  v_orientation text;
  v_length numeric;
  v_next_x numeric;
  v_bounds jsonb := public.domino_visual_bounds();
  v_min_x numeric := (v_bounds ->> 'minX')::numeric;
  v_max_x numeric := (v_bounds ->> 'maxX')::numeric;
begin
  if v_direction not in ('left', 'right') then
    return p_endpoint;
  end if;

  v_orientation := public.domino_visual_orientation(
    v_direction,
    public.domino_tile_is_double(p_tile)
  );
  v_length := public.domino_visual_path_length(v_direction, v_orientation);

  if v_direction = 'right' then
    v_next_x := (p_endpoint ->> 'x')::numeric + v_length + 2;

    if v_next_x > v_max_x then
      return p_endpoint || jsonb_build_object('direction', 'down');
    end if;
  else
    v_next_x := (p_endpoint ->> 'x')::numeric - v_length - 2;

    if v_next_x < v_min_x then
      return p_endpoint || jsonb_build_object('direction', 'down');
    end if;
  end if;

  return p_endpoint;
end;
$$;

create or replace function public.domino_advance_visual_endpoint(
  p_endpoint jsonb,
  p_placement jsonb,
  p_side text
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_direction text := p_placement ->> 'direction';
  v_row integer := coalesce((p_endpoint ->> 'row')::integer, 0);
  v_run_count integer := coalesce((p_endpoint ->> 'runCount')::integer, 0);
  v_next_direction text;
begin
  if v_direction = 'down' then
    v_row := v_row + 1;
    v_run_count := 0;
    v_next_direction := case
      when p_side = 'right' then
        case when mod(v_row, 2) = 1 then 'left' else 'right' end
      else
        case when mod(v_row, 2) = 1 then 'right' else 'left' end
    end;
  else
    v_next_direction := v_direction;
    v_run_count := v_run_count + 1;
  end if;

  return jsonb_build_object(
    'x', p_placement -> 'endpointX',
    'y', p_placement -> 'endpointY',
    'direction', v_next_direction,
    'pip', p_placement -> 'exposedPip',
    'row', v_row,
    'runCount', v_run_count
  );
end;
$$;

create or replace function public.domino_calculate_next_visual_placement(
  p_board_state jsonb,
  p_tile jsonb,
  p_side text,
  p_player_id uuid,
  p_turn_number integer,
  p_left_value integer,
  p_right_value integer
)
returns jsonb
language plpgsql
stable
as $$
declare
  v_board jsonb := public.domino_ensure_visual_board_state(p_board_state);
  v_placement_count integer := jsonb_array_length(coalesce(v_board -> 'placements', '[]'::jsonb));
  v_visual jsonb := v_board -> 'visual';
  v_endpoint jsonb;
  v_direction text;
  v_tile_left integer := public.domino_tile_left(p_tile);
  v_tile_right integer := public.domino_tile_right(p_tile);
  v_connected_pip integer;
  v_exposed_pip integer;
  v_orientation text;
  v_length numeric;
  v_offset numeric;
  v_endpoint_x numeric;
  v_endpoint_y numeric;
  v_center_x numeric;
  v_center_y numeric;
  v_next_endpoint_x numeric;
  v_next_endpoint_y numeric;
  v_rotation integer;
  v_placement jsonb;
  v_new_endpoint jsonb;
  v_endpoint_key text;
begin
  if v_placement_count = 0 or p_side = 'start' then
    v_placement := public.domino_calculate_start_visual_placement(
      p_tile,
      p_player_id,
      p_turn_number
    ) || jsonb_build_object(
      'leftValue', p_left_value,
      'rightValue', p_right_value
    );

    v_visual := v_visual || jsonb_build_object(
      'leftEndpoint', jsonb_build_object(
        'x', case when public.domino_tile_is_double(p_tile) then -14 else -28 end,
        'y', 0,
        'direction', 'left',
        'pip', p_left_value,
        'row', 0,
        'runCount', 0
      ),
      'rightEndpoint', jsonb_build_object(
        'x', case when public.domino_tile_is_double(p_tile) then 14 else 28 end,
        'y', 0,
        'direction', 'right',
        'pip', p_right_value,
        'row', 0,
        'runCount', 0
      ),
      'bounds', public.domino_visual_bounds()
    );

    return jsonb_build_object('placement', v_placement, 'visual', v_visual);
  end if;

  v_endpoint_key := case when p_side = 'left' then 'leftEndpoint' else 'rightEndpoint' end;
  v_endpoint := v_visual -> v_endpoint_key;

  if v_endpoint is null or v_endpoint = 'null'::jsonb then
    v_endpoint := public.domino_fallback_visual_endpoint(v_board, p_side);
  end if;

  v_endpoint := public.domino_turn_visual_endpoint_if_needed(v_endpoint, p_tile);
  v_direction := v_endpoint ->> 'direction';
  v_endpoint_x := (v_endpoint ->> 'x')::numeric;
  v_endpoint_y := (v_endpoint ->> 'y')::numeric;

  if v_tile_left = (v_endpoint ->> 'pip')::integer then
    v_connected_pip := v_tile_left;
    v_exposed_pip := v_tile_right;
  elsif v_tile_right = (v_endpoint ->> 'pip')::integer then
    v_connected_pip := v_tile_right;
    v_exposed_pip := v_tile_left;
  else
    v_connected_pip := case when p_side = 'left' then p_right_value else p_left_value end;
    v_exposed_pip := case when p_side = 'left' then p_left_value else p_right_value end;
  end if;

  v_orientation := public.domino_visual_orientation(
    v_direction,
    public.domino_tile_is_double(p_tile)
  );
  v_length := public.domino_visual_path_length(v_direction, v_orientation);
  v_offset := v_length / 2 + 2;

  if v_direction = 'right' then
    v_center_x := v_endpoint_x + v_offset;
    v_center_y := v_endpoint_y;
    v_next_endpoint_x := v_endpoint_x + v_length + 2;
    v_next_endpoint_y := v_endpoint_y;
  elsif v_direction = 'left' then
    v_center_x := v_endpoint_x - v_offset;
    v_center_y := v_endpoint_y;
    v_next_endpoint_x := v_endpoint_x - v_length - 2;
    v_next_endpoint_y := v_endpoint_y;
  elsif v_direction = 'up' then
    v_center_x := v_endpoint_x;
    v_center_y := v_endpoint_y - v_offset;
    v_next_endpoint_x := v_endpoint_x;
    v_next_endpoint_y := v_endpoint_y - v_length - 2;
  else
    v_center_x := v_endpoint_x;
    v_center_y := v_endpoint_y + v_offset;
    v_next_endpoint_x := v_endpoint_x;
    v_next_endpoint_y := v_endpoint_y + v_length + 2;
  end if;

  v_rotation := case
    when public.domino_tile_is_double(p_tile) then
      case when v_orientation = 'horizontal' then 90 else 0 end
    when v_orientation = 'horizontal' then
      case when v_direction = 'left' then 270 else 90 end
    else
      case when v_direction = 'up' then 180 else 0 end
  end;

  v_placement := jsonb_build_object(
    'tile', p_tile,
    'playedBy', p_player_id,
    'side', p_side,
    'leftValue', p_left_value,
    'rightValue', p_right_value,
    'turnNumber', p_turn_number,
    'x', round(v_center_x)::integer,
    'y', round(v_center_y)::integer,
    'rotation', v_rotation,
    'orientation', v_orientation,
    'direction', v_direction,
    'connectedPip', v_connected_pip,
    'exposedPip', v_exposed_pip,
    'isDouble', public.domino_tile_is_double(p_tile),
    'endpointX', round(v_next_endpoint_x)::integer,
    'endpointY', round(v_next_endpoint_y)::integer
  );

  v_new_endpoint := public.domino_advance_visual_endpoint(
    v_endpoint,
    v_placement,
    p_side
  );
  v_placement := v_placement - 'endpointX' - 'endpointY';
  v_visual := jsonb_set(v_visual, array[v_endpoint_key], v_new_endpoint, true);
  v_visual := jsonb_set(v_visual, '{bounds}', public.domino_visual_bounds(), true);

  return jsonb_build_object('placement', v_placement, 'visual', v_visual);
end;
$$;

create or replace function public.start_game(p_table_id uuid)
returns table(
  game_id uuid,
  table_id uuid,
  status text,
  current_turn_player_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_table public.game_tables%rowtype;
  v_seated_count integer;
  v_ready_count integer;
  v_game_id uuid;
  v_current_turn_player_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not public.user_has_profile(v_user_id) then
    raise exception 'profile_required';
  end if;

  select gt.*
  into v_table
  from public.game_tables gt
  where gt.id = p_table_id
  for update;

  if not found then
    raise exception 'table_not_found';
  end if;

  if v_table.status = 'in_game' or v_table.current_game_id is not null then
    raise exception 'game_already_started';
  end if;

  if v_table.status in ('finished', 'closed') then
    raise exception 'table_unavailable';
  end if;

  if not exists (
    select 1
    from public.table_seats ts
    where ts.table_id = p_table_id
      and ts.player_id = v_user_id
  ) then
    raise exception 'not_seated';
  end if;

  select
    count(ts.player_id)::integer,
    count(ts.player_id) filter (where ts.is_ready)::integer
  into v_seated_count, v_ready_count
  from public.table_seats ts
  where ts.table_id = p_table_id;

  if v_seated_count <> v_table.max_players then
    raise exception 'not_enough_players';
  end if;

  if v_ready_count <> v_table.max_players then
    raise exception 'not_all_ready';
  end if;

  if exists (
    select 1
    from public.games g
    where g.table_id = p_table_id
      and g.status in ('setup', 'active')
  ) then
    raise exception 'game_already_started';
  end if;

  insert into public.games (
    table_id,
    game_mode,
    status,
    current_round_number,
    board_state,
    started_at
  )
  values (
    p_table_id,
    v_table.game_mode,
    'active',
    1,
    public.domino_create_initial_board_state(),
    now()
  )
  returning id into v_game_id;

  insert into public.game_players (
    game_id,
    player_id,
    seat_number,
    turn_order,
    score,
    round_score,
    has_passed
  )
  select
    v_game_id,
    ts.player_id,
    ts.seat_number,
    ts.seat_number,
    0,
    0,
    false
  from public.table_seats ts
  where ts.table_id = p_table_id
    and ts.player_id is not null
  order by ts.seat_number;

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
    where gp.game_id = v_game_id
  ),
  dealt_tiles as (
    select
      sp.player_id,
      sp.turn_order,
      st.tile,
      st.tile_index
    from shuffled_tiles st
    join seated_players sp on ((st.tile_index - 1) % 4) + 1 = sp.player_index
  ),
  hand_rows as (
    insert into public.game_player_hands (game_id, player_id, tiles)
    select
      v_game_id,
      dt.player_id,
      jsonb_agg(dt.tile order by dt.tile_index)
    from dealt_tiles dt
    group by dt.player_id
    returning player_id, tiles
  ),
  hand_stats as (
    select
      hr.player_id,
      gp.turn_order,
      max((hand_tile.tile ->> 'left')::integer) filter (
        where (hand_tile.tile ->> 'isDouble')::boolean
      ) as highest_double,
      max((hand_tile.tile ->> 'pipTotal')::integer) as highest_total
    from hand_rows hr
    join public.game_players gp
      on gp.game_id = v_game_id
     and gp.player_id = hr.player_id
    cross join jsonb_array_elements(hr.tiles) as hand_tile(tile)
    group by hr.player_id, gp.turn_order
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

  update public.games g
  set current_turn_player_id = v_current_turn_player_id
  where g.id = v_game_id;

  update public.game_tables gt
  set status = 'in_game',
      current_game_id = v_game_id
  where gt.id = p_table_id;

  return query
  select v_game_id, p_table_id, 'active'::text, v_current_turn_player_id;
end;
$$;

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
  v_visual_play jsonb;
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

  v_board := public.domino_ensure_visual_board_state(v_game.board_state);
  v_placements := coalesce(v_board -> 'placements', '[]'::jsonb);
  v_placement_count := jsonb_array_length(v_placements);
  v_open_left := (v_board #>> '{openEnds,left}')::integer;
  v_open_right := (v_board #>> '{openEnds,right}')::integer;
  v_tile_left := public.domino_tile_left(v_tile);
  v_tile_right := public.domino_tile_right(v_tile);

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

  v_visual_play := public.domino_calculate_next_visual_placement(
    v_board,
    v_tile,
    v_side,
    v_user_id,
    v_move_number,
    v_left_value,
    v_right_value
  );
  v_placement := v_visual_play -> 'placement';

  v_new_board := jsonb_build_object(
    'placements', case
      when v_placement_count = 0 then jsonb_build_array(v_placement)
      when v_side = 'left' then jsonb_build_array(v_placement) || v_placements
      else v_placements || jsonb_build_array(v_placement)
    end,
    'openEnds', jsonb_build_object(
      'left', v_new_open_left,
      'right', v_new_open_right
    ),
    'visual', v_visual_play -> 'visual'
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

revoke all on function public.domino_normalize_tile_id(text) from public;
revoke all on function public.domino_tile_left(jsonb) from public;
revoke all on function public.domino_tile_right(jsonb) from public;
revoke all on function public.domino_tile_is_double(jsonb) from public;
revoke all on function public.domino_opposite_pip(jsonb, integer) from public;
revoke all on function public.domino_visual_bounds() from public;
revoke all on function public.domino_create_initial_board_state() from public;
revoke all on function public.domino_create_initial_visual_state() from public;
revoke all on function public.domino_ensure_visual_board_state(jsonb) from public;
revoke all on function public.domino_visual_orientation(text, boolean) from public;
revoke all on function public.domino_visual_path_length(text, text) from public;
revoke all on function public.domino_calculate_start_visual_placement(jsonb, uuid, integer) from public;
revoke all on function public.domino_fallback_visual_endpoint(jsonb, text) from public;
revoke all on function public.domino_turn_visual_endpoint_if_needed(jsonb, jsonb) from public;
revoke all on function public.domino_advance_visual_endpoint(jsonb, jsonb, text) from public;
revoke all on function public.domino_calculate_next_visual_placement(jsonb, jsonb, text, uuid, integer, integer, integer) from public;
revoke all on function public.start_game(uuid) from public;
revoke all on function public.play_tile(uuid, text, text) from public;

grant execute on function public.start_game(uuid) to authenticated;
grant execute on function public.play_tile(uuid, text, text) to authenticated;
