-- Sprint 25.3 patch: use exposed pip-cell anchors for visual board geometry.
-- This replaces visual helper functions only. Gameplay validation, scoring,
-- hands, RLS, chat, and presence behavior are unchanged.

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
  v_start_tile jsonb := p_board_state #> '{placements,0,tile}';
  v_start_is_double boolean := coalesce(public.domino_tile_is_double(v_start_tile), false);
  v_start_endpoint_offset integer := case when v_start_is_double then 0 else 14 end;
begin
  v_pip := case
    when p_side = 'left' then (p_board_state #>> '{openEnds,left}')::integer
    else (p_board_state #>> '{openEnds,right}')::integer
  end;

  return jsonb_build_object(
    'x', case when p_side = 'left' then -v_start_endpoint_offset else v_start_endpoint_offset end,
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
  v_side text := coalesce(p_endpoint ->> 'side', 'right');
  v_pending_direction text := p_endpoint ->> 'pendingDirection';
  v_is_double_endpoint boolean := coalesce((p_endpoint ->> 'isDoubleEndpoint')::boolean, false);
  v_is_double_tile boolean := public.domino_tile_is_double(p_tile);
  v_horizontal_direction text := coalesce(
    p_endpoint ->> 'horizontalDirection',
    case when v_direction in ('left', 'right') then v_direction else null end,
    case when v_side = 'left' then 'left' else 'right' end
  );
  v_horizontal_run_count integer := coalesce((p_endpoint ->> 'horizontalRunCount')::integer, 0);
  v_vertical_run_count integer := coalesce((p_endpoint ->> 'verticalRunCount')::integer, 0);
  v_horizontal_run_length integer := 4;
  v_vertical_run_length integer := 2;
  v_cell_size numeric := 28;
  v_endpoint_advance numeric := case when v_is_double_tile then v_cell_size else v_cell_size * 2 end;
  v_next_x numeric;
  v_next_y numeric;
  v_bounds jsonb := public.domino_visual_bounds();
  v_min_x numeric := (v_bounds ->> 'minX')::numeric;
  v_max_x numeric := (v_bounds ->> 'maxX')::numeric;
  v_min_y numeric := (v_bounds ->> 'minY')::numeric;
  v_max_y numeric := (v_bounds ->> 'maxY')::numeric;
  v_vertical_direction text;
  v_next_horizontal_direction text;
begin
  if v_pending_direction is not null and not v_is_double_tile then
    v_next_x := (p_endpoint ->> 'x')::numeric;
    v_next_y := (p_endpoint ->> 'y')::numeric;

    if v_is_double_endpoint then
      if v_pending_direction = 'right' then
        v_next_x := v_next_x + v_cell_size / 2;
      elsif v_pending_direction = 'left' then
        v_next_x := v_next_x - v_cell_size / 2;
      elsif v_pending_direction = 'up' then
        v_next_y := v_next_y - v_cell_size / 2;
      else
        v_next_y := v_next_y + v_cell_size / 2;
      end if;
    end if;

    return (p_endpoint - 'pendingDirection' - 'isDoubleEndpoint') || jsonb_build_object(
      'x', round(v_next_x)::integer,
      'y', round(v_next_y)::integer,
      'direction', v_pending_direction,
      'horizontalDirection', case
        when v_pending_direction in ('left', 'right') then v_pending_direction
        else v_horizontal_direction
      end,
      'horizontalRunCount', 0,
      'verticalRunCount', 0,
      'runCount', 0
    );
  end if;

  if v_direction in ('left', 'right') then
    if v_direction = 'right' then
      v_next_x := (p_endpoint ->> 'x')::numeric + v_endpoint_advance;
    else
      v_next_x := (p_endpoint ->> 'x')::numeric - v_endpoint_advance;
    end if;

    if
      v_horizontal_run_count >= v_horizontal_run_length
      or (v_direction = 'right' and v_next_x > v_max_x)
      or (v_direction = 'left' and v_next_x < v_min_x)
    then
      v_vertical_direction := case when v_side = 'left' then 'up' else 'down' end;

      if v_is_double_tile then
        return p_endpoint || jsonb_build_object(
          'pendingDirection', v_vertical_direction,
          'horizontalDirection', v_direction
        );
      end if;

      return (p_endpoint - 'pendingDirection' - 'isDoubleEndpoint') || jsonb_build_object(
        'direction', v_vertical_direction,
        'horizontalDirection', v_direction,
        'horizontalRunCount', 0,
        'verticalRunCount', 0,
        'runCount', 0
      );
    end if;

    return p_endpoint;
  end if;

  if v_direction in ('up', 'down') then
    if v_direction = 'up' then
      v_next_y := (p_endpoint ->> 'y')::numeric - v_endpoint_advance;
    else
      v_next_y := (p_endpoint ->> 'y')::numeric + v_endpoint_advance;
    end if;

    if
      v_vertical_run_count >= v_vertical_run_length
      or (v_direction = 'up' and v_next_y < v_min_y)
      or (v_direction = 'down' and v_next_y > v_max_y)
    then
      v_next_horizontal_direction := case
        when v_horizontal_direction = 'right' then 'left'
        else 'right'
      end;

      if v_is_double_tile then
        return p_endpoint || jsonb_build_object(
          'pendingDirection', v_next_horizontal_direction
        );
      end if;

      return (p_endpoint - 'pendingDirection' - 'isDoubleEndpoint') || jsonb_build_object(
        'direction', v_next_horizontal_direction,
        'horizontalRunCount', 0,
        'verticalRunCount', 0,
        'runCount', 0
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
    'verticalRunCount', v_vertical_run_count,
    'isDoubleEndpoint', coalesce((p_placement ->> 'isDouble')::boolean, false)
  );

  if p_endpoint ? 'pendingDirection' then
    v_new_endpoint := v_new_endpoint || jsonb_build_object(
      'pendingDirection', p_endpoint ->> 'pendingDirection'
    );
  end if;

  return v_new_endpoint;
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
  v_is_double boolean := public.domino_tile_is_double(p_tile);
  v_connected_pip integer;
  v_exposed_pip integer;
  v_connected_tile_side text;
  v_orientation text;
  v_cell_size numeric := 28;
  v_offset numeric;
  v_endpoint_advance numeric;
  v_start_endpoint_offset integer;
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
    v_start_endpoint_offset := case when v_is_double then 0 else 14 end;
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
        'x', -v_start_endpoint_offset,
        'y', 0,
        'direction', 'left',
        'pip', p_left_value,
        'side', 'left',
        'row', 0,
        'runCount', 0,
        'horizontalDirection', 'left',
        'horizontalRunCount', 0,
        'verticalRunCount', 0
      ),
      'rightEndpoint', jsonb_build_object(
        'x', v_start_endpoint_offset,
        'y', 0,
        'direction', 'right',
        'pip', p_right_value,
        'side', 'right',
        'row', 0,
        'runCount', 0,
        'horizontalDirection', 'right',
        'horizontalRunCount', 0,
        'verticalRunCount', 0
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

  v_connected_tile_side := case
    when v_tile_left = v_connected_pip then 'left'
    when v_tile_right = v_connected_pip then 'right'
    else null
  end;

  v_orientation := public.domino_visual_orientation(
    v_direction,
    v_is_double
  );
  v_offset := case when v_is_double then v_cell_size else v_cell_size * 1.5 end;
  v_endpoint_advance := case when v_is_double then v_cell_size else v_cell_size * 2 end;

  if v_direction = 'right' then
    v_center_x := v_endpoint_x + v_offset;
    v_center_y := v_endpoint_y;
    v_next_endpoint_x := v_endpoint_x + v_endpoint_advance;
    v_next_endpoint_y := v_endpoint_y;
  elsif v_direction = 'left' then
    v_center_x := v_endpoint_x - v_offset;
    v_center_y := v_endpoint_y;
    v_next_endpoint_x := v_endpoint_x - v_endpoint_advance;
    v_next_endpoint_y := v_endpoint_y;
  elsif v_direction = 'up' then
    v_center_x := v_endpoint_x;
    v_center_y := v_endpoint_y - v_offset;
    v_next_endpoint_x := v_endpoint_x;
    v_next_endpoint_y := v_endpoint_y - v_endpoint_advance;
  else
    v_center_x := v_endpoint_x;
    v_center_y := v_endpoint_y + v_offset;
    v_next_endpoint_x := v_endpoint_x;
    v_next_endpoint_y := v_endpoint_y + v_endpoint_advance;
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
    'isDouble', v_is_double,
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
