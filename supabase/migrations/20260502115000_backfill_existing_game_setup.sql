do $$
declare
  v_game record;
  v_current_turn_player_id uuid;
begin
  for v_game in
    select
      g.id,
      g.table_id,
      g.status,
      g.board_state,
      g.current_round_number
    from public.games g
    where g.status in ('setup', 'active')
      and not exists (
        select 1
        from public.game_players gp
        where gp.game_id = g.id
      )
      and (
        select count(ts.player_id)
        from public.table_seats ts
        where ts.table_id = g.table_id
      ) = 4
  loop
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
      v_game.id,
      ts.player_id,
      ts.seat_number,
      ts.seat_number,
      0,
      0,
      false
    from public.table_seats ts
    where ts.table_id = v_game.table_id
      and ts.player_id is not null
    order by ts.seat_number
    on conflict do nothing;

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
      where gp.game_id = v_game.id
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
        v_game.id,
        dt.player_id,
        jsonb_agg(dt.tile order by dt.tile_index)
      from dealt_tiles dt
      group by dt.player_id
      on conflict do nothing
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
        on gp.game_id = v_game.id
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
    set
      status = 'active',
      current_round_number = greatest(g.current_round_number, 1),
      current_turn_player_id = coalesce(g.current_turn_player_id, v_current_turn_player_id),
      board_state = case
        when g.board_state = '{}'::jsonb then jsonb_build_object(
          'placements', '[]'::jsonb,
          'openEnds', jsonb_build_object('left', null, 'right', null)
        )
        else g.board_state
      end,
      started_at = coalesce(g.started_at, now())
    where g.id = v_game.id;

    update public.game_tables gt
    set
      status = 'in_game',
      current_game_id = v_game.id
    where gt.id = v_game.table_id;
  end loop;
end;
$$;
