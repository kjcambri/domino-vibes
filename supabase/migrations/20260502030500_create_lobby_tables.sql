create table if not exists public.game_tables (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  game_mode text not null default 'cutthroat_4',
  max_players integer not null default 4,
  status text not null default 'waiting',
  is_system_created boolean not null default true,
  created_by uuid null references auth.users(id) on delete set null,
  current_game_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_tables_max_players_range check (max_players between 2 and 4),
  constraint game_tables_status_check check (
    status in ('waiting', 'full', 'in_game', 'finished', 'closed')
  ),
  constraint game_tables_game_mode_check check (game_mode in ('cutthroat_4'))
);

create table if not exists public.table_seats (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.game_tables(id) on delete cascade,
  seat_number integer not null,
  player_id uuid null references auth.users(id) on delete set null,
  is_ready boolean not null default false,
  joined_at timestamptz null,
  updated_at timestamptz not null default now(),
  constraint table_seats_seat_number_range check (seat_number between 1 and 4),
  constraint table_seats_table_seat_unique unique (table_id, seat_number),
  constraint table_seats_table_player_unique unique (table_id, player_id)
);

create index if not exists table_seats_table_id_idx on public.table_seats(table_id);
create index if not exists table_seats_player_id_idx on public.table_seats(player_id);
create index if not exists game_tables_status_idx on public.game_tables(status);
create index if not exists game_tables_game_mode_idx on public.game_tables(game_mode);

alter table public.game_tables enable row level security;
alter table public.table_seats enable row level security;

drop policy if exists "Authenticated users can read game tables" on public.game_tables;
create policy "Authenticated users can read game tables"
  on public.game_tables
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read table seats" on public.table_seats;
create policy "Authenticated users can read table seats"
  on public.table_seats
  for select
  to authenticated
  using (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_game_tables_updated_at on public.game_tables;
create trigger set_game_tables_updated_at
  before update on public.game_tables
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_table_seats_updated_at on public.table_seats;
create trigger set_table_seats_updated_at
  before update on public.table_seats
  for each row
  execute function public.set_updated_at();

create or replace function public.user_has_profile(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_user_id
  );
$$;

create or replace function public.user_has_active_seat(
  p_user_id uuid,
  p_except_table_id uuid default null
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.table_seats ts
    join public.game_tables gt on gt.id = ts.table_id
    where ts.player_id = p_user_id
      and gt.status in ('waiting', 'full', 'in_game')
      and (p_except_table_id is null or ts.table_id <> p_except_table_id)
  );
$$;

create or replace function public.set_table_status_from_seats(p_table_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max_players integer;
  v_seated_count integer;
  v_current_status text;
begin
  select max_players, status
  into v_max_players, v_current_status
  from public.game_tables
  where id = p_table_id;

  if v_current_status in ('in_game', 'finished', 'closed') then
    return;
  end if;

  select count(*)
  into v_seated_count
  from public.table_seats ts
  where ts.table_id = p_table_id
    and ts.player_id is not null;

  update public.game_tables
  set status = case
    when v_seated_count >= v_max_players then 'full'
    else 'waiting'
  end
  where id = p_table_id;
end;
$$;

create or replace function public.join_table(p_table_id uuid)
returns table(table_id uuid, seat_number integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_table public.game_tables%rowtype;
  v_seat public.table_seats%rowtype;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not public.user_has_profile(v_user_id) then
    raise exception 'profile_required';
  end if;

  select *
  into v_table
  from public.game_tables
  where id = p_table_id
  for update;

  if not found then
    raise exception 'table_not_found';
  end if;

  if v_table.status in ('in_game', 'finished', 'closed') then
    raise exception 'table_unavailable';
  end if;

  if exists (
    select 1
    from public.table_seats ts
    where ts.table_id = p_table_id
      and ts.player_id = v_user_id
  ) then
    raise exception 'already_seated';
  end if;

  if public.user_has_active_seat(v_user_id, p_table_id) then
    raise exception 'already_seated_elsewhere';
  end if;

  select *
  into v_seat
  from public.table_seats ts
  where ts.table_id = p_table_id
    and ts.player_id is null
  order by ts.seat_number
  limit 1
  for update;

  if not found then
    raise exception 'table_full';
  end if;

  update public.table_seats
  set player_id = v_user_id,
      is_ready = false,
      joined_at = now()
  where id = v_seat.id;

  perform public.set_table_status_from_seats(p_table_id);

  return query
  select p_table_id, v_seat.seat_number;
end;
$$;

create or replace function public.sit_at_table(
  p_table_id uuid,
  p_seat_number integer
)
returns table(table_id uuid, seat_number integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_table public.game_tables%rowtype;
  v_seat public.table_seats%rowtype;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_seat_number < 1 or p_seat_number > 4 then
    raise exception 'invalid_seat';
  end if;

  if not public.user_has_profile(v_user_id) then
    raise exception 'profile_required';
  end if;

  select *
  into v_table
  from public.game_tables
  where id = p_table_id
  for update;

  if not found then
    raise exception 'table_not_found';
  end if;

  if v_table.status in ('in_game', 'finished', 'closed') then
    raise exception 'table_unavailable';
  end if;

  if exists (
    select 1
    from public.table_seats ts
    where ts.table_id = p_table_id
      and ts.player_id = v_user_id
  ) then
    raise exception 'already_seated';
  end if;

  if public.user_has_active_seat(v_user_id, p_table_id) then
    raise exception 'already_seated_elsewhere';
  end if;

  select *
  into v_seat
  from public.table_seats ts
  where ts.table_id = p_table_id
    and ts.seat_number = p_seat_number
  for update;

  if not found then
    raise exception 'invalid_seat';
  end if;

  if v_seat.player_id is not null then
    raise exception 'seat_taken';
  end if;

  update public.table_seats
  set player_id = v_user_id,
      is_ready = false,
      joined_at = now()
  where id = v_seat.id;

  perform public.set_table_status_from_seats(p_table_id);

  return query
  select p_table_id, p_seat_number;
end;
$$;

create or replace function public.leave_table(p_table_id uuid)
returns table(table_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_table_status text;
  v_seat_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select status
  into v_table_status
  from public.game_tables
  where id = p_table_id
  for update;

  if not found then
    raise exception 'table_not_found';
  end if;

  if v_table_status = 'in_game' then
    raise exception 'game_in_progress';
  end if;

  select id
  into v_seat_id
  from public.table_seats ts
  where ts.table_id = p_table_id
    and ts.player_id = v_user_id
  for update;

  if not found then
    raise exception 'not_seated';
  end if;

  update public.table_seats
  set player_id = null,
      is_ready = false,
      joined_at = null
  where id = v_seat_id;

  perform public.set_table_status_from_seats(p_table_id);

  return query
  select p_table_id;
end;
$$;

create or replace function public.get_lobby_tables()
returns table(
  id uuid,
  name text,
  game_mode text,
  status text,
  max_players integer,
  seated_count integer,
  is_system_created boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  return query
  select
    gt.id,
    gt.name,
    gt.game_mode,
    gt.status,
    gt.max_players,
    count(ts.player_id)::integer as seated_count,
    gt.is_system_created,
    gt.created_at
  from public.game_tables gt
  left join public.table_seats ts on ts.table_id = gt.id
  where gt.is_system_created = true
    and gt.status <> 'closed'
  group by gt.id
  order by gt.created_at asc, gt.name asc;
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

  select *
  into v_table
  from public.game_tables
  where id = p_table_id;

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
      'isSystemCreated', v_table.is_system_created,
      'createdAt', v_table.created_at,
      'updatedAt', v_table.updated_at
    ),
    'seats', v_seats
  );
end;
$$;

revoke all on function public.join_table(uuid) from public;
revoke all on function public.sit_at_table(uuid, integer) from public;
revoke all on function public.leave_table(uuid) from public;
revoke all on function public.get_lobby_tables() from public;
revoke all on function public.get_table_room(uuid) from public;

grant execute on function public.join_table(uuid) to authenticated;
grant execute on function public.sit_at_table(uuid, integer) to authenticated;
grant execute on function public.leave_table(uuid) to authenticated;
grant execute on function public.get_lobby_tables() to authenticated;
grant execute on function public.get_table_room(uuid) to authenticated;

grant select on public.game_tables to authenticated;
grant select on public.table_seats to authenticated;

with table_seed(name) as (
  values
    ('Rum Shop Table 1'),
    ('Backyard Table 2'),
    ('Island Table 3'),
    ('Domino Vibes Table 4')
),
inserted_tables as (
  insert into public.game_tables (name, game_mode, max_players, status, is_system_created)
  select name, 'cutthroat_4', 4, 'waiting', true
  from table_seed
  where not exists (
    select 1
    from public.game_tables gt
    where gt.name = table_seed.name
      and gt.is_system_created = true
  )
  returning id
)
insert into public.table_seats (table_id, seat_number)
select id, seat_number
from inserted_tables
cross join generate_series(1, 4) as seat_number;

insert into public.table_seats (table_id, seat_number)
select gt.id, seat_number
from public.game_tables gt
cross join generate_series(1, gt.max_players) as seat_number
where gt.is_system_created = true
  and gt.name in (
    'Rum Shop Table 1',
    'Backyard Table 2',
    'Island Table 3',
    'Domino Vibes Table 4'
  )
on conflict (table_id, seat_number) do nothing;

alter table public.game_tables replica identity full;
alter table public.table_seats replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.game_tables;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.table_seats;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;
