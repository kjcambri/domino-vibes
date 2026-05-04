create or replace function public.get_featured_live_game_preview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game public.games%rowtype;
  v_table public.game_tables%rowtype;
  v_players jsonb;
  v_move_count integer;
  v_dominoes_in_play integer;
  v_current_turn_seat integer;
begin
  select g.*
  into v_game
  from public.games as g
  join public.game_tables as gt on gt.id = g.table_id
  where g.status = 'active'
    and gt.status = 'in_game'
    and gt.current_game_id = g.id
  order by g.updated_at desc, g.started_at desc nulls last, g.created_at desc
  limit 1;

  if not found then
    return null;
  end if;

  select gt.*
  into v_table
  from public.game_tables as gt
  where gt.id = v_game.table_id;

  select count(*)::integer
  into v_move_count
  from public.game_moves as gm
  where gm.game_id = v_game.id;

  v_dominoes_in_play := case
    when jsonb_typeof(v_game.board_state -> 'placements') = 'array'
      then jsonb_array_length(v_game.board_state -> 'placements')
    else 0
  end;

  select gp.seat_number
  into v_current_turn_seat
  from public.game_players as gp
  where gp.game_id = v_game.id
    and gp.player_id = v_game.current_turn_player_id
  limit 1;

  /*
    Public homepage preview safety:
    - Do not read public.game_player_hands.
    - Do not return hand tiles.
    - Derive hand counts from current-round play moves only.
  */
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'displayName', coalesce(p.display_name, p.username, 'Seat ' || gp.seat_number::text),
        'seatNumber', gp.seat_number,
        'score', gp.score,
        'handCount', greatest(0, 7 - coalesce(play_counts.play_count, 0)),
        'isCurrentTurn', gp.player_id = v_game.current_turn_player_id
      )
      order by gp.seat_number
    ),
    '[]'::jsonb
  )
  into v_players
  from public.game_players as gp
  left join public.profiles as p on p.id = gp.player_id
  left join lateral (
    select count(*)::integer as play_count
    from public.game_moves as gm
    where gm.game_id = gp.game_id
      and gm.player_id = gp.player_id
      and gm.round_number = v_game.current_round_number
      and gm.move_type = 'play'
  ) as play_counts on true
  where gp.game_id = v_game.id;

  return jsonb_build_object(
    'gameId', v_game.id,
    'tableId', v_game.table_id,
    'tableName', v_table.name,
    'gameMode', v_game.game_mode,
    'status', v_game.status,
    'currentRoundNumber', v_game.current_round_number,
    'pointsToWin', 6,
    'moveCount', v_move_count,
    'dominoesInPlay', v_dominoes_in_play,
    'currentTurnSeat', v_current_turn_seat,
    'boardState', jsonb_build_object(
      'placements', case
        when jsonb_typeof(v_game.board_state -> 'placements') = 'array'
          then v_game.board_state -> 'placements'
        else '[]'::jsonb
      end,
      'openEnds', case
        when jsonb_typeof(v_game.board_state -> 'openEnds') = 'object'
          then v_game.board_state -> 'openEnds'
        else jsonb_build_object('left', null, 'right', null)
      end,
      'visual', v_game.board_state -> 'visual'
    ),
    'players', v_players
  );
end;
$$;

revoke all on function public.get_featured_live_game_preview() from public;
grant execute on function public.get_featured_live_game_preview() to anon;
grant execute on function public.get_featured_live_game_preview() to authenticated;
