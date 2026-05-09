-- Sprint 25.2 patch: align saved board geometry by matching pip-cell anchors.
-- This updates only pure visual helper functions used while saving board_state.
-- Gameplay validation, scoring, hands, auth, RLS, chat, and presence are unchanged.

create or replace function public.domino_visual_direction_delta(
  p_direction text,
  p_amount numeric
)
returns jsonb
language sql
immutable
set search_path = public
as $domino_visual_direction_delta$
  select jsonb_build_object(
    'x', case
      when p_direction = 'right' then p_amount
      when p_direction = 'left' then -p_amount
      else 0
    end,
    'y', case
      when p_direction = 'down' then p_amount
      when p_direction = 'up' then -p_amount
      else 0
    end
  );
$domino_visual_direction_delta$;

create or replace function public.domino_visual_direction_matches_orientation(
  p_direction text,
  p_orientation text
)
returns boolean
language sql
immutable
set search_path = public
as $domino_visual_direction_matches_orientation$
  select case
    when p_direction in ('left', 'right') then p_orientation = 'horizontal'
    when p_direction in ('up', 'down') then p_orientation = 'vertical'
    else false
  end;
$domino_visual_direction_matches_orientation$;

create or replace function public.domino_visual_pip_offset(
  p_side text,
  p_rotation integer
)
returns jsonb
language sql
immutable
set search_path = public
as $domino_visual_pip_offset$
  select case
    when p_side = 'left' then
      case mod((p_rotation % 360 + 360), 360)
        when 0 then jsonb_build_object('x', 0, 'y', -14)
        when 90 then jsonb_build_object('x', 14, 'y', 0)
        when 180 then jsonb_build_object('x', 0, 'y', 14)
        when 270 then jsonb_build_object('x', -14, 'y', 0)
        else jsonb_build_object('x', 0, 'y', -14)
      end
    else
      case mod((p_rotation % 360 + 360), 360)
        when 0 then jsonb_build_object('x', 0, 'y', 14)
        when 90 then jsonb_build_object('x', -14, 'y', 0)
        when 180 then jsonb_build_object('x', 0, 'y', -14)
        when 270 then jsonb_build_object('x', 14, 'y', 0)
        else jsonb_build_object('x', 0, 'y', 14)
      end
  end;
$domino_visual_pip_offset$;

create or replace function public.domino_visual_connected_tile_side(
  p_tile jsonb,
  p_connected_pip integer
)
returns text
language sql
immutable
set search_path = public
as $domino_visual_connected_tile_side$
  select case
    when public.domino_tile_left(p_tile) = p_connected_pip then 'left'
    when public.domino_tile_right(p_tile) = p_connected_pip then 'right'
    else null
  end;
$domino_visual_connected_tile_side$;

create or replace function public.domino_visual_connection_origin(
  p_endpoint jsonb
)
returns jsonb
language plpgsql
immutable
set search_path = public
as $domino_visual_connection_origin$
declare
  v_direction text := p_endpoint ->> 'direction';
  v_double_orientation text := p_endpoint ->> 'doubleOrientation';
  v_delta jsonb;
  v_x numeric := (p_endpoint ->> 'x')::numeric;
  v_y numeric := (p_endpoint ->> 'y')::numeric;
begin
  if
    coalesce((p_endpoint ->> 'isDoubleEndpoint')::boolean, false)
    and v_double_orientation is not null
    and public.domino_visual_direction_matches_orientation(
      v_direction,
      v_double_orientation
    )
  then
    v_delta := public.domino_visual_direction_delta(v_direction, 14);

    return jsonb_build_object(
      'x', v_x + (v_delta ->> 'x')::numeric,
      'y', v_y + (v_delta ->> 'y')::numeric
    );
  end if;

  return jsonb_build_object('x', v_x, 'y', v_y);
end;
$domino_visual_connection_origin$;

create or replace function public.domino_visual_project_endpoint(
  p_endpoint jsonb,
  p_tile jsonb
)
returns jsonb
language plpgsql
immutable
set search_path = public
as $domino_visual_project_endpoint$
declare
  v_origin jsonb := public.domino_visual_connection_origin(p_endpoint);
  v_direction text := p_endpoint ->> 'direction';
  v_delta jsonb := public.domino_visual_direction_delta(
    v_direction,
    case when public.domino_tile_is_double(p_tile) then 28 else 56 end
  );
begin
  return jsonb_build_object(
    'x', (v_origin ->> 'x')::numeric + (v_delta ->> 'x')::numeric,
    'y', (v_origin ->> 'y')::numeric + (v_delta ->> 'y')::numeric
  );
end;
$domino_visual_project_endpoint$;

create or replace function public.domino_turn_visual_endpoint_if_needed(
  p_endpoint jsonb,
  p_tile jsonb
)
returns jsonb
language plpgsql
immutable
set search_path = public
as $domino_turn_visual_endpoint_if_needed$
declare
  v_direction text := p_endpoint ->> 'direction';
  v_pending_direction text := p_endpoint ->> 'pendingDirection';
  v_side text := coalesce(p_endpoint ->> 'side', 'right');
  v_horizontal_direction text := coalesce(
    p_endpoint ->> 'horizontalDirection',
    case when v_direction in ('left', 'right') then v_direction else null end,
    case when v_side = 'left' then 'left' else 'right' end
  );
  v_horizontal_run_count integer := coalesce((p_endpoint ->> 'horizontalRunCount')::integer, 0);
  v_vertical_run_count integer := coalesce((p_endpoint ->> 'verticalRunCount')::integer, 0);
  v_horizontal_run_length integer := 4;
  v_vertical_run_length integer := 2;
  v_projected_endpoint jsonb;
  v_bounds jsonb := public.domino_visual_bounds();
  v_min_x numeric := (v_bounds ->> 'minX')::numeric;
  v_max_x numeric := (v_bounds ->> 'maxX')::numeric;
  v_min_y numeric := (v_bounds ->> 'minY')::numeric;
  v_max_y numeric := (v_bounds ->> 'maxY')::numeric;
  v_vertical_direction text;
  v_next_horizontal_direction text;
begin
  if v_pending_direction is not null then
    v_horizontal_direction := case
      when v_pending_direction in ('left', 'right') then v_pending_direction
      when v_direction in ('left', 'right') then v_direction
      else v_horizontal_direction
    end;

    return (p_endpoint - 'pendingDirection') || jsonb_build_object(
      'previousDirection', v_direction,
      'direction', v_pending_direction,
      'turnFromDouble', true,
      'horizontalDirection', v_horizontal_direction,
      'horizontalRunCount', 0,
      'verticalRunCount', 0
    );
  end if;

  v_projected_endpoint := public.domino_visual_project_endpoint(p_endpoint, p_tile);

  if v_direction in ('left', 'right') then
    if
      v_horizontal_run_count >= v_horizontal_run_length
      or (
        v_direction = 'right'
        and (v_projected_endpoint ->> 'x')::numeric > v_max_x
      )
      or (
        v_direction = 'left'
        and (v_projected_endpoint ->> 'x')::numeric < v_min_x
      )
    then
      v_vertical_direction := case when v_side = 'left' then 'up' else 'down' end;

      if public.domino_tile_is_double(p_tile) then
        return (p_endpoint - 'previousDirection' - 'turnFromDouble') || jsonb_build_object(
          'pendingDirection', v_vertical_direction
        );
      end if;

      return (p_endpoint - 'pendingDirection' - 'turnFromDouble') || jsonb_build_object(
        'previousDirection', v_direction,
        'direction', v_vertical_direction,
        'horizontalDirection', v_direction,
        'horizontalRunCount', 0,
        'verticalRunCount', 0
      );
    end if;

    return p_endpoint - 'previousDirection' - 'turnFromDouble';
  end if;

  if v_direction in ('up', 'down') then
    if
      v_vertical_run_count >= v_vertical_run_length
      or (
        v_direction = 'up'
        and (v_projected_endpoint ->> 'y')::numeric < v_min_y
      )
      or (
        v_direction = 'down'
        and (v_projected_endpoint ->> 'y')::numeric > v_max_y
      )
    then
      v_next_horizontal_direction := case
        when v_horizontal_direction = 'right' then 'left'
        else 'right'
      end;

      if public.domino_tile_is_double(p_tile) then
        return (p_endpoint - 'previousDirection' - 'turnFromDouble') || jsonb_build_object(
          'pendingDirection', v_next_horizontal_direction
        );
      end if;

      return (p_endpoint - 'pendingDirection' - 'turnFromDouble') || jsonb_build_object(
        'previousDirection', v_direction,
        'direction', v_next_horizontal_direction,
        'horizontalDirection', v_next_horizontal_direction,
        'horizontalRunCount', 0,
        'verticalRunCount', 0
      );
    end if;
  end if;

  return p_endpoint - 'previousDirection' - 'turnFromDouble';
end;
$domino_turn_visual_endpoint_if_needed$;

create or replace function public.domino_fallback_visual_endpoint(
  p_board_state jsonb,
  p_side text
)
returns jsonb
language plpgsql
stable
set search_path = public
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
    'x', case when p_side = 'left' then -14 else 14 end,
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
set search_path = public
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
  v_new_endpoint jsonb;
begin
  if v_direction in ('up', 'down') then
    v_vertical_run_count := v_vertical_run_count + 1;
    v_horizontal_run_count := 0;
  else
    v_horizontal_run_count := v_horizontal_run_count + 1;
    v_vertical_run_count := 0;
    v_horizontal_direction := v_direction;
  end if;

  v_new_endpoint := jsonb_build_object(
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

  if p_endpoint ? 'pendingDirection' then
    v_new_endpoint := v_new_endpoint || jsonb_build_object(
      'pendingDirection', p_endpoint ->> 'pendingDirection'
    );
  end if;

  if coalesce((p_placement ->> 'isDouble')::boolean, false) then
    v_new_endpoint := v_new_endpoint || jsonb_build_object(
      'isDoubleEndpoint', true,
      'doubleOrientation', p_placement ->> 'orientation'
    );
  end if;

  return v_new_endpoint;
end;
$domino_advance_visual_endpoint$;

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
set search_path = public
as $domino_calculate_next_visual_placement$
declare
  v_board jsonb := public.domino_ensure_visual_board_state(p_board_state);
  v_placement_count integer := jsonb_array_length(coalesce(v_board -> 'placements', '[]'::jsonb));
  v_visual jsonb := v_board -> 'visual';
  v_endpoint jsonb;
  v_direction text;
  v_origin jsonb;
  v_delta jsonb;
  v_connected_cell_center jsonb;
  v_connected_offset jsonb;
  v_exposed_offset jsonb;
  v_tile_left integer := public.domino_tile_left(p_tile);
  v_tile_right integer := public.domino_tile_right(p_tile);
  v_connected_pip integer;
  v_exposed_pip integer;
  v_connected_tile_side text;
  v_safe_connected_tile_side text;
  v_orientation text;
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

    v_orientation := v_placement ->> 'orientation';
    v_rotation := (v_placement ->> 'rotation')::integer;

    v_visual := v_visual || jsonb_build_object(
      'leftEndpoint', case
        when public.domino_tile_is_double(p_tile) then
          jsonb_build_object(
            'x', 0,
            'y', 0,
            'direction', 'left',
            'pip', p_left_value,
            'side', 'left',
            'row', 0,
            'runCount', 0,
            'horizontalDirection', 'left',
            'horizontalRunCount', 0,
            'verticalRunCount', 0,
            'isDoubleEndpoint', true,
            'doubleOrientation', v_orientation
          )
        else
          jsonb_build_object(
            'x', public.domino_visual_pip_offset(
              public.domino_visual_connected_tile_side(p_tile, p_left_value),
              v_rotation
            ) -> 'x',
            'y', public.domino_visual_pip_offset(
              public.domino_visual_connected_tile_side(p_tile, p_left_value),
              v_rotation
            ) -> 'y',
            'direction', 'left',
            'pip', p_left_value,
            'side', 'left',
            'row', 0,
            'runCount', 0,
            'horizontalDirection', 'left',
            'horizontalRunCount', 0,
            'verticalRunCount', 0
          )
      end,
      'rightEndpoint', case
        when public.domino_tile_is_double(p_tile) then
          jsonb_build_object(
            'x', 0,
            'y', 0,
            'direction', 'right',
            'pip', p_right_value,
            'side', 'right',
            'row', 0,
            'runCount', 0,
            'horizontalDirection', 'right',
            'horizontalRunCount', 0,
            'verticalRunCount', 0,
            'isDoubleEndpoint', true,
            'doubleOrientation', v_orientation
          )
        else
          jsonb_build_object(
            'x', public.domino_visual_pip_offset(
              public.domino_visual_connected_tile_side(p_tile, p_right_value),
              v_rotation
            ) -> 'x',
            'y', public.domino_visual_pip_offset(
              public.domino_visual_connected_tile_side(p_tile, p_right_value),
              v_rotation
            ) -> 'y',
            'direction', 'right',
            'pip', p_right_value,
            'side', 'right',
            'row', 0,
            'runCount', 0,
            'horizontalDirection', 'right',
            'horizontalRunCount', 0,
            'verticalRunCount', 0
          )
      end,
      'bounds', public.domino_visual_bounds()
    );

    return jsonb_build_object('placement', v_placement, 'visual', v_visual);
  end if;

  v_endpoint_key := case when p_side = 'left' then 'leftEndpoint' else 'rightEndpoint' end;
  v_endpoint := v_visual -> v_endpoint_key;

  if v_endpoint is null or v_endpoint = 'null'::jsonb then
    v_endpoint := public.domino_fallback_visual_endpoint(v_board, p_side);
  else
    v_endpoint := v_endpoint || jsonb_build_object(
      'side', p_side,
      'horizontalDirection', coalesce(
        v_endpoint ->> 'horizontalDirection',
        case
          when v_endpoint ->> 'direction' in ('left', 'right')
            then v_endpoint ->> 'direction'
          else null
        end,
        case when p_side = 'left' then 'left' else 'right' end
      ),
      'horizontalRunCount', coalesce((v_endpoint ->> 'horizontalRunCount')::integer, 0),
      'verticalRunCount', coalesce((v_endpoint ->> 'verticalRunCount')::integer, 0)
    );
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

  v_connected_tile_side := public.domino_visual_connected_tile_side(
    p_tile,
    v_connected_pip
  );
  v_safe_connected_tile_side := coalesce(v_connected_tile_side, 'left');

  v_orientation := public.domino_visual_orientation(
    v_direction,
    public.domino_tile_is_double(p_tile)
  );
  v_rotation := public.domino_visual_rotation_for_connection(
    p_tile,
    v_direction,
    v_orientation,
    v_connected_pip
  );
  v_origin := public.domino_visual_connection_origin(v_endpoint);
  v_delta := public.domino_visual_direction_delta(v_direction, 28);

  if public.domino_tile_is_double(p_tile) then
    v_center_x := (v_origin ->> 'x')::numeric + (v_delta ->> 'x')::numeric;
    v_center_y := (v_origin ->> 'y')::numeric + (v_delta ->> 'y')::numeric;
    v_next_endpoint_x := v_center_x;
    v_next_endpoint_y := v_center_y;
  else
    v_connected_cell_center := jsonb_build_object(
      'x', (v_origin ->> 'x')::numeric + (v_delta ->> 'x')::numeric,
      'y', (v_origin ->> 'y')::numeric + (v_delta ->> 'y')::numeric
    );
    v_connected_offset := public.domino_visual_pip_offset(
      v_safe_connected_tile_side,
      v_rotation
    );
    v_exposed_offset := public.domino_visual_pip_offset(
      case when v_safe_connected_tile_side = 'left' then 'right' else 'left' end,
      v_rotation
    );
    v_center_x := (v_connected_cell_center ->> 'x')::numeric -
      (v_connected_offset ->> 'x')::numeric;
    v_center_y := (v_connected_cell_center ->> 'y')::numeric -
      (v_connected_offset ->> 'y')::numeric;
    v_next_endpoint_x := v_center_x + (v_exposed_offset ->> 'x')::numeric;
    v_next_endpoint_y := v_center_y + (v_exposed_offset ->> 'y')::numeric;
  end if;

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
    'connectedTileSide', v_connected_tile_side,
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
$domino_calculate_next_visual_placement$;

revoke all on function public.domino_visual_direction_delta(text, numeric) from public;
revoke all on function public.domino_visual_direction_matches_orientation(text, text) from public;
revoke all on function public.domino_visual_pip_offset(text, integer) from public;
revoke all on function public.domino_visual_connected_tile_side(jsonb, integer) from public;
revoke all on function public.domino_visual_connection_origin(jsonb) from public;
revoke all on function public.domino_visual_project_endpoint(jsonb, jsonb) from public;
revoke all on function public.domino_turn_visual_endpoint_if_needed(jsonb, jsonb) from public;
revoke all on function public.domino_fallback_visual_endpoint(jsonb, text) from public;
revoke all on function public.domino_advance_visual_endpoint(jsonb, jsonb, text) from public;
revoke all on function public.domino_calculate_next_visual_placement(jsonb, jsonb, text, uuid, integer, integer, integer) from public;
