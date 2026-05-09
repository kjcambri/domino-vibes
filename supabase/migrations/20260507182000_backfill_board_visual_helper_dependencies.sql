-- Sprint 25 compatibility patch.
-- Some production helper functions from the server-saved board geometry sprint
-- were applied outside recorded migration history. Re-create the pure visual
-- helpers needed by domino_calculate_next_visual_placement().

create or replace function public.domino_normalize_tile_id(p_tile_id text)
returns text
language sql
immutable
as $domino_normalize_tile_id$
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
$domino_normalize_tile_id$;

create or replace function public.domino_tile_left(p_tile jsonb)
returns integer
language sql
immutable
as $domino_tile_left$
  select (p_tile ->> 'left')::integer;
$domino_tile_left$;

create or replace function public.domino_tile_right(p_tile jsonb)
returns integer
language sql
immutable
as $domino_tile_right$
  select (p_tile ->> 'right')::integer;
$domino_tile_right$;

create or replace function public.domino_tile_is_double(p_tile jsonb)
returns boolean
language sql
immutable
as $domino_tile_is_double$
  select coalesce((p_tile ->> 'isDouble')::boolean, false);
$domino_tile_is_double$;

create or replace function public.domino_visual_bounds()
returns jsonb
language sql
immutable
as $domino_visual_bounds$
  select jsonb_build_object(
    'minX', -240,
    'maxX', 240,
    'minY', -260,
    'maxY', 260
  );
$domino_visual_bounds$;

create or replace function public.domino_ensure_visual_board_state(p_board_state jsonb)
returns jsonb
language plpgsql
immutable
as $domino_ensure_visual_board_state$
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

  return jsonb_build_object(
    'placements', coalesce(v_board -> 'placements', '[]'::jsonb),
    'openEnds', coalesce(
      v_board -> 'openEnds',
      jsonb_build_object('left', null, 'right', null)
    ),
    'visual', v_visual
  );
end;
$domino_ensure_visual_board_state$;

create or replace function public.domino_visual_orientation(
  p_direction text,
  p_is_double boolean
)
returns text
language sql
immutable
as $domino_visual_orientation$
  select case
    when p_is_double then
      case when p_direction in ('left', 'right') then 'vertical' else 'horizontal' end
    else
      case when p_direction in ('left', 'right') then 'horizontal' else 'vertical' end
  end;
$domino_visual_orientation$;

create or replace function public.domino_visual_path_length(
  p_direction text,
  p_orientation text
)
returns numeric
language sql
immutable
as $domino_visual_path_length$
  select case
    when p_direction in ('left', 'right') then
      case when p_orientation = 'horizontal' then 56 else 28 end
    else
      case when p_orientation = 'vertical' then 56 else 28 end
  end;
$domino_visual_path_length$;

create or replace function public.domino_visual_rotation_for_connection(
  p_tile jsonb,
  p_direction text,
  p_orientation text,
  p_connected_pip integer
)
returns integer
language plpgsql
immutable
as $domino_visual_rotation_for_connection$
declare
  v_tile_left integer := public.domino_tile_left(p_tile);
  v_tile_right integer := public.domino_tile_right(p_tile);
  v_connected_tile_side text;
begin
  if public.domino_tile_is_double(p_tile) then
    return case when p_orientation = 'horizontal' then 90 else 0 end;
  end if;

  v_connected_tile_side := case
    when v_tile_left = p_connected_pip then 'left'
    when v_tile_right = p_connected_pip then 'right'
    else null
  end;

  if v_connected_tile_side = 'left' then
    return case p_direction
      when 'right' then 270
      when 'left' then 90
      when 'down' then 0
      else 180
    end;
  end if;

  if v_connected_tile_side = 'right' then
    return case p_direction
      when 'right' then 90
      when 'left' then 270
      when 'down' then 180
      else 0
    end;
  end if;

  return case p_direction
    when 'left' then 270
    when 'up' then 180
    when 'right' then 90
    else 0
  end;
end;
$domino_visual_rotation_for_connection$;

create or replace function public.domino_calculate_start_visual_placement(
  p_tile jsonb,
  p_player_id uuid,
  p_turn_number integer
)
returns jsonb
language plpgsql
immutable
as $domino_calculate_start_visual_placement$
declare
  v_is_double boolean := public.domino_tile_is_double(p_tile);
  v_orientation text := case when v_is_double then 'vertical' else 'horizontal' end;
  v_rotation integer;
begin
  v_rotation := case when v_is_double then 0 else 270 end;

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
    'connectedTileSide', null,
    'isDouble', v_is_double
  );
end;
$domino_calculate_start_visual_placement$;

create or replace function public.domino_fallback_visual_endpoint(
  p_board_state jsonb,
  p_side text
)
returns jsonb
language plpgsql
stable
as $domino_fallback_visual_endpoint$
declare
  v_pip integer;
  v_direction text := case when p_side = 'left' then 'left' else 'right' end;
begin
  v_pip := case
    when p_side = 'left' then (p_board_state #>> '{openEnds,left}')::integer
    else (p_board_state #>> '{openEnds,right}')::integer
  end;

  return jsonb_build_object(
    'x', case when p_side = 'left' then -28 else 28 end,
    'y', 0,
    'direction', v_direction,
    'pip', v_pip,
    'side', p_side,
    'row', 0,
    'runCount', 0,
    'horizontalDirection', v_direction,
    'horizontalRunCount', 0,
    'verticalRunCount', 0
  );
end;
$domino_fallback_visual_endpoint$;

create or replace function public.domino_advance_visual_endpoint(
  p_endpoint jsonb,
  p_placement jsonb,
  p_side text
)
returns jsonb
language plpgsql
immutable
as $domino_advance_visual_endpoint$
declare
  v_direction text := p_placement ->> 'direction';
  v_side text := coalesce(p_endpoint ->> 'side', p_side);
  v_row integer := coalesce((p_endpoint ->> 'row')::integer, 0);
  v_horizontal_run_count integer := coalesce((p_endpoint ->> 'horizontalRunCount')::integer, 0);
  v_vertical_run_count integer := coalesce((p_endpoint ->> 'verticalRunCount')::integer, 0);
  v_horizontal_direction text := coalesce(
    p_endpoint ->> 'horizontalDirection',
    case
      when p_endpoint ->> 'direction' in ('left', 'right')
        then p_endpoint ->> 'direction'
      else null
    end,
    case when p_side = 'left' then 'left' else 'right' end
  );
begin
  if v_direction in ('up', 'down') then
    v_vertical_run_count := v_vertical_run_count + 1;
    v_horizontal_run_count := 0;
  else
    v_horizontal_run_count := v_horizontal_run_count + 1;
    v_vertical_run_count := 0;
    v_horizontal_direction := v_direction;
  end if;

  return jsonb_build_object(
    'x', p_placement -> 'endpointX',
    'y', p_placement -> 'endpointY',
    'direction', v_direction,
    'pip', p_placement -> 'exposedPip',
    'side', v_side,
    'row', v_row,
    'runCount', greatest(v_horizontal_run_count, v_vertical_run_count),
    'horizontalDirection', v_horizontal_direction,
    'horizontalRunCount', v_horizontal_run_count,
    'verticalRunCount', v_vertical_run_count
  );
end;
$domino_advance_visual_endpoint$;

revoke all on function public.domino_normalize_tile_id(text) from public;
revoke all on function public.domino_tile_left(jsonb) from public;
revoke all on function public.domino_tile_right(jsonb) from public;
revoke all on function public.domino_tile_is_double(jsonb) from public;
revoke all on function public.domino_visual_bounds() from public;
revoke all on function public.domino_ensure_visual_board_state(jsonb) from public;
revoke all on function public.domino_visual_orientation(text, boolean) from public;
revoke all on function public.domino_visual_path_length(text, text) from public;
revoke all on function public.domino_visual_rotation_for_connection(jsonb, text, text, integer) from public;
revoke all on function public.domino_calculate_start_visual_placement(jsonb, uuid, integer) from public;
revoke all on function public.domino_fallback_visual_endpoint(jsonb, text) from public;
revoke all on function public.domino_advance_visual_endpoint(jsonb, jsonb, text) from public;
