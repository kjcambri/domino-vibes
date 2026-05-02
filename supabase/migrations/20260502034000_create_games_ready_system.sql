create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.game_tables(id) on delete cascade,
  game_mode text not null default 'cutthroat_4',
  status text not null default 'setup',
  current_round_number integer not null default 0,
  current_turn_player_id uuid null references auth.users(id) on delete set null,
  board_state jsonb not null default '{}'::jsonb,
  started_at timestamptz null,
  finished_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint games_status_check check (
    status in ('setup', 'active', 'round_finished', 'finished', 'cancelled')
  ),
  constraint games_game_mode_check check (game_mode in ('cutthroat_4'))
);

create index if not exists games_table_id_idx on public.games(table_id);
create index if not exists games_status_idx on public.games(status);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'game_tables_current_game_id_fkey'
      and conrelid = 'public.game_tables'::regclass
  ) then
    alter table public.game_tables
      add constraint game_tables_current_game_id_fkey
      foreign key (current_game_id)
      references public.games(id)
      on delete set null;
  end if;
end;
$$;

alter table public.games enable row level security;

drop policy if exists "Seated users can read games" on public.games;
create policy "Seated users can read games"
  on public.games
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.table_seats ts
      where ts.table_id = games.table_id
        and ts.player_id = auth.uid()
    )
  );

drop trigger if exists set_games_updated_at on public.games;
create trigger set_games_updated_at
  before update on public.games
  for each row
  execute function public.set_updated_at();

create or replace function public.toggle_ready(
  p_table_id uuid,
  p_ready boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_table public.game_tables%rowtype;
  v_seat_id uuid;
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

  if v_table.status in ('in_game', 'finished', 'closed') then
    raise exception 'table_unavailable';
  end if;

  select ts.id
  into v_seat_id
  from public.table_seats ts
  where ts.table_id = p_table_id
    and ts.player_id = v_user_id
  for update;

  if not found then
    raise exception 'not_seated';
  end if;

  update public.table_seats ts
  set is_ready = p_ready
  where ts.id = v_seat_id;

  return public.get_table_room(p_table_id);
end;
$$;

create or replace function public.start_game(p_table_id uuid)
returns table(game_id uuid, table_id uuid, status text)
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
    'setup',
    0,
    '{}'::jsonb,
    now()
  )
  returning id into v_game_id;

  update public.game_tables gt
  set status = 'in_game',
      current_game_id = v_game_id
  where gt.id = p_table_id;

  return query
  select v_game_id, p_table_id, 'setup'::text;
end;
$$;

create or replace function public.get_table_room(p_table_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_table public.game_tables%rowtype;
  v_seats jsonb;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select gt.*
  into v_table
  from public.game_tables gt
  where gt.id = p_table_id;

  if not found then
    raise exception 'table_not_found';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', ts.id,
        'tableId', ts.table_id,
        'seatNumber', ts.seat_number,
        'playerId', ts.player_id,
        'isReady', ts.is_ready,
        'joinedAt', ts.joined_at,
        'updatedAt', ts.updated_at,
        'player', case
          when p.id is null then null
          else jsonb_build_object(
            'username', p.username,
            'displayName', p.display_name,
            'avatarUrl', p.avatar_url
          )
        end
      )
      order by ts.seat_number
    ),
    '[]'::jsonb
  )
  into v_seats
  from public.table_seats ts
  left join public.profiles p on p.id = ts.player_id
  where ts.table_id = p_table_id;

  return jsonb_build_object(
    'table', jsonb_build_object(
      'id', v_table.id,
      'name', v_table.name,
      'gameMode', v_table.game_mode,
      'status', v_table.status,
      'maxPlayers', v_table.max_players,
      'currentGameId', v_table.current_game_id,
      'isSystemCreated', v_table.is_system_created,
      'createdAt', v_table.created_at,
      'updatedAt', v_table.updated_at
    ),
    'seats', v_seats
  );
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
  v_seats jsonb;
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

  select gt.*
  into v_table
  from public.game_tables gt
  where gt.id = v_game.table_id;

  if not exists (
    select 1
    from public.table_seats ts
    where ts.table_id = v_game.table_id
      and ts.player_id = v_user_id
  ) then
    raise exception 'not_seated';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'seatNumber', ts.seat_number,
        'playerId', ts.player_id,
        'isReady', ts.is_ready,
        'username', p.username,
        'displayName', p.display_name,
        'avatarUrl', p.avatar_url
      )
      order by ts.seat_number
    ),
    '[]'::jsonb
  )
  into v_seats
  from public.table_seats ts
  left join public.profiles p on p.id = ts.player_id
  where ts.table_id = v_game.table_id;

  return jsonb_build_object(
    'game', jsonb_build_object(
      'id', v_game.id,
      'tableId', v_game.table_id,
      'tableName', v_table.name,
      'gameMode', v_game.game_mode,
      'status', v_game.status,
      'currentRoundNumber', v_game.current_round_number,
      'boardState', v_game.board_state,
      'createdAt', v_game.created_at,
      'startedAt', v_game.started_at
    ),
    'players', v_seats
  );
end;
$$;

revoke all on function public.toggle_ready(uuid, boolean) from public;
revoke all on function public.start_game(uuid) from public;
revoke all on function public.get_game_room(uuid) from public;

grant execute on function public.toggle_ready(uuid, boolean) to authenticated;
grant execute on function public.start_game(uuid) to authenticated;
grant execute on function public.get_game_room(uuid) to authenticated;
grant select on public.games to authenticated;

alter table public.games replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.games;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;
