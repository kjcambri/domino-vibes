-- Sprint 9 patch: make endpoint continuation explicit for doubles and mirror
-- left/right chain turning. Endpoint x/y values are exposed chain edges; doubles
-- use their displayed short side along the chain direction.

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
    'horizontalDirection', v_direction
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
  v_connection_gap numeric := 0;
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
    v_next_x := (p_endpoint ->> 'x')::numeric + v_length + v_connection_gap;

    if v_next_x > v_max_x then
      return p_endpoint || jsonb_build_object(
        'direction', 'down',
        'lastTurnDirection', 'right'
      );
    end if;
  else
    v_next_x := (p_endpoint ->> 'x')::numeric - v_length - v_connection_gap;

    if v_next_x < v_min_x then
      return p_endpoint || jsonb_build_object(
        'direction', 'down',
        'lastTurnDirection', 'left'
      );
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
  v_side text := coalesce(p_endpoint ->> 'side', p_side);
  v_row integer := coalesce((p_endpoint ->> 'row')::integer, 0);
  v_run_count integer := coalesce((p_endpoint ->> 'runCount')::integer, 0);
  v_horizontal_direction text := coalesce(
    p_endpoint ->> 'horizontalDirection',
    case
      when p_endpoint ->> 'direction' in ('left', 'right')
        then p_endpoint ->> 'direction'
      else null
    end,
    case when p_side = 'left' then 'left' else 'right' end
  );
  v_last_turn_direction text := p_endpoint ->> 'lastTurnDirection';
  v_next_direction text;
begin
  if v_direction = 'down' then
    v_row := v_row + 1;
    v_run_count := 0;
    v_next_direction := case
      when coalesce(v_last_turn_direction, v_horizontal_direction) = 'right'
        then 'left'
      else 'right'
    end;
    v_horizontal_direction := v_next_direction;
  else
    v_next_direction := v_direction;
    v_run_count := v_run_count + 1;

    if v_direction in ('left', 'right') then
      v_horizontal_direction := v_direction;
    end if;
  end if;

  return jsonb_strip_nulls(jsonb_build_object(
    'x', p_placement -> 'endpointX',
    'y', p_placement -> 'endpointY',
    'direction', v_next_direction,
    'pip', p_placement -> 'exposedPip',
    'side', v_side,
    'row', v_row,
    'runCount', v_run_count,
    'horizontalDirection', v_horizontal_direction,
    'lastTurnDirection', null
  ));
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
  v_connected_tile_side text;
  v_orientation text;
  v_length numeric;
  v_connection_gap numeric := 0;
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
        'side', 'left',
        'row', 0,
        'runCount', 0,
        'horizontalDirection', 'left'
      ),
      'rightEndpoint', jsonb_build_object(
        'x', case when public.domino_tile_is_double(p_tile) then 14 else 28 end,
        'y', 0,
        'direction', 'right',
        'pip', p_right_value,
        'side', 'right',
        'row', 0,
        'runCount', 0,
        'horizontalDirection', 'right'
      ),
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
      )
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

  v_connected_tile_side := case
    when v_tile_left = v_connected_pip then 'left'
    when v_tile_right = v_connected_pip then 'right'
    else null
  end;

  v_orientation := public.domino_visual_orientation(
    v_direction,
    public.domino_tile_is_double(p_tile)
  );
  v_length := public.domino_visual_path_length(v_direction, v_orientation);
  v_offset := v_length / 2 + v_connection_gap;

  if v_direction = 'right' then
    v_center_x := v_endpoint_x + v_offset;
    v_center_y := v_endpoint_y;
    v_next_endpoint_x := v_endpoint_x + v_length + v_connection_gap;
    v_next_endpoint_y := v_endpoint_y;
  elsif v_direction = 'left' then
    v_center_x := v_endpoint_x - v_offset;
    v_center_y := v_endpoint_y;
    v_next_endpoint_x := v_endpoint_x - v_length - v_connection_gap;
    v_next_endpoint_y := v_endpoint_y;
  elsif v_direction = 'up' then
    v_center_x := v_endpoint_x;
    v_center_y := v_endpoint_y - v_offset;
    v_next_endpoint_x := v_endpoint_x;
    v_next_endpoint_y := v_endpoint_y - v_length - v_connection_gap;
  else
    v_center_x := v_endpoint_x;
    v_center_y := v_endpoint_y + v_offset;
    v_next_endpoint_x := v_endpoint_x;
    v_next_endpoint_y := v_endpoint_y + v_length + v_connection_gap;
  end if;

  v_rotation := public.domino_visual_rotation_for_connection(
    p_tile,
    v_direction,
    v_orientation,
    v_connected_pip
  );

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
$$;

revoke all on function public.domino_fallback_visual_endpoint(jsonb, text) from public;
revoke all on function public.domino_turn_visual_endpoint_if_needed(jsonb, jsonb) from public;
revoke all on function public.domino_advance_visual_endpoint(jsonb, jsonb, text) from public;
revoke all on function public.domino_calculate_next_visual_placement(jsonb, jsonb, text, uuid, integer, integer, integer) from public;
