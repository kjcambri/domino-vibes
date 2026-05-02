create table if not exists public.game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  seat_number integer not null,
  turn_order integer not null,
  score integer not null default 0,
  round_score integer not null default 0,
  has_passed boolean not null default false,
  is_connected boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_players_game_player_unique unique (game_id, player_id),
  constraint game_players_game_seat_unique unique (game_id, seat_number),
  constraint game_players_game_turn_unique unique (game_id, turn_order),
  constraint game_players_seat_number_range check (seat_number between 1 and 4),
  constraint game_players_turn_order_range check (turn_order between 1 and 4)
);

create table if not exists public.game_player_hands (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  tiles jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_player_hands_game_player_unique unique (game_id, player_id),
  constraint game_player_hands_tiles_array check (jsonb_typeof(tiles) = 'array')
);

create index if not exists game_players_game_id_idx on public.game_players(game_id);
create index if not exists game_players_player_id_idx on public.game_players(player_id);
create index if not exists game_player_hands_game_id_idx on public.game_player_hands(game_id);
create index if not exists game_player_hands_player_id_idx on public.game_player_hands(player_id);

alter table public.game_players enable row level security;
alter table public.game_player_hands enable row level security;

create or replace function public.user_is_game_participant(
  p_game_id uuid,
  p_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.game_players gp
    where gp.game_id = p_game_id
      and gp.player_id = p_user_id
  );
$$;

revoke all on function public.user_is_game_participant(uuid, uuid) from public;
grant execute on function public.user_is_game_participant(uuid, uuid) to authenticated;

drop policy if exists "Game participants can read game players" on public.game_players;
create policy "Game participants can read game players"
  on public.game_players
  for select
  to authenticated
  using (public.user_is_game_participant(game_id, auth.uid()));

drop policy if exists "Players can read their own hand" on public.game_player_hands;
create policy "Players can read their own hand"
  on public.game_player_hands
  for select
  to authenticated
  using (player_id = auth.uid());

drop trigger if exists set_game_players_updated_at on public.game_players;
create trigger set_game_players_updated_at
  before update on public.game_players
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_game_player_hands_updated_at on public.game_player_hands;
create trigger set_game_player_hands_updated_at
  before update on public.game_player_hands
  for each row
  execute function public.set_updated_at();

drop function if exists public.start_game(uuid);

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
    jsonb_build_object(
      'placements', '[]'::jsonb,
      'openEnds', jsonb_build_object('left', null, 'right', null)
    ),
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

create or replace function public.get_my_hand(p_game_id uuid)
returns table(
  game_id uuid,
  player_id uuid,
  tiles jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1
    from public.game_players gp
    where gp.game_id = p_game_id
      and gp.player_id = v_user_id
  ) then
    raise exception 'not_seated';
  end if;

  return query
  select
    gph.game_id,
    gph.player_id,
    gph.tiles
  from public.game_player_hands gph
  where gph.game_id = p_game_id
    and gph.player_id = v_user_id;
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
      'createdAt', v_game.created_at,
      'startedAt', v_game.started_at
    ),
    'players', v_players,
    'currentUser', v_my_player
  );
end;
$$;

revoke all on function public.start_game(uuid) from public;
revoke all on function public.get_my_hand(uuid) from public;
revoke all on function public.get_game_room(uuid) from public;

grant execute on function public.start_game(uuid) to authenticated;
grant execute on function public.get_my_hand(uuid) to authenticated;
grant execute on function public.get_game_room(uuid) to authenticated;

grant select on public.game_players to authenticated;
grant select on public.game_player_hands to authenticated;

alter table public.game_players replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.game_players;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;
