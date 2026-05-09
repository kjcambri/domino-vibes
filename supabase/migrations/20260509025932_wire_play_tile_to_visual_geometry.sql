-- Sprint 25.1 follow-up: wire play_tile back to the visual geometry helper on
-- databases that still have the older gameplay RPC. This keeps gameplay rules
-- unchanged while saving x/y/rotation/orientation on fresh board placements.

create or replace function public.play_tile(
  p_game_id uuid,
  p_tile_id text,
  p_side text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $play_tile$
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
$play_tile$;

revoke all on function public.play_tile(uuid, text, text) from public;
grant execute on function public.play_tile(uuid, text, text) to authenticated;
