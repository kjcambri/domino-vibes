-- Sprint 12: presence heartbeats, stale-player marking, and dev-safe cleanup helpers.

alter table public.table_seats
  add column if not exists last_seen_at timestamptz null default now();

update public.table_seats as ts
set last_seen_at = case
    when ts.player_id is null then null
    else coalesce(ts.last_seen_at, now())
  end;

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

  select gt.*
  into v_table
  from public.game_tables as gt
  where gt.id = p_table_id
  for update;

  if not found then
    raise exception 'table_not_found';
  end if;

  if v_table.status in ('in_game', 'finished', 'closed') then
    raise exception 'table_unavailable';
  end if;

  if exists (
    select 1
    from public.table_seats as ts
    where ts.table_id = p_table_id
      and ts.player_id = v_user_id
  ) then
    raise exception 'already_seated';
  end if;

  if public.user_has_active_seat(v_user_id, p_table_id) then
    raise exception 'already_seated_elsewhere';
  end if;

  select ts.*
  into v_seat
  from public.table_seats as ts
  where ts.table_id = p_table_id
    and ts.player_id is null
  order by ts.seat_number
  limit 1
  for update;

  if not found then
    raise exception 'table_full';
  end if;

  update public.table_seats as ts
  set player_id = v_user_id,
      is_ready = false,
      joined_at = now(),
      last_seen_at = now()
  where ts.id = v_seat.id;

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

  select gt.*
  into v_table
  from public.game_tables as gt
  where gt.id = p_table_id
  for update;

  if not found then
    raise exception 'table_not_found';
  end if;

  if v_table.status in ('in_game', 'finished', 'closed') then
    raise exception 'table_unavailable';
  end if;

  if exists (
    select 1
    from public.table_seats as ts
    where ts.table_id = p_table_id
      and ts.player_id = v_user_id
  ) then
    raise exception 'already_seated';
  end if;

  if public.user_has_active_seat(v_user_id, p_table_id) then
    raise exception 'already_seated_elsewhere';
  end if;

  select ts.*
  into v_seat
  from public.table_seats as ts
  where ts.table_id = p_table_id
    and ts.seat_number = p_seat_number
  for update;

  if not found then
    raise exception 'invalid_seat';
  end if;

  if v_seat.player_id is not null then
    raise exception 'seat_taken';
  end if;

  update public.table_seats as ts
  set player_id = v_user_id,
      is_ready = false,
      joined_at = now(),
      last_seen_at = now()
  where ts.id = v_seat.id;

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

  select gt.status
  into v_table_status
  from public.game_tables as gt
  where gt.id = p_table_id
  for update;

  if not found then
    raise exception 'table_not_found';
  end if;

  if v_table_status = 'in_game' then
    raise exception 'game_in_progress';
  end if;

  select ts.id
  into v_seat_id
  from public.table_seats as ts
  where ts.table_id = p_table_id
    and ts.player_id = v_user_id
  for update;

  if not found then
    raise exception 'not_seated';
  end if;

  update public.table_seats as ts
  set player_id = null,
      is_ready = false,
      joined_at = null,
      last_seen_at = null
  where ts.id = v_seat_id;

  perform public.set_table_status_from_seats(p_table_id);

  return query
  select p_table_id;
end;
$$;

create or replace function public.leave_finished_game(p_game_id uuid)
returns table (
  game_id uuid,
  table_id uuid,
  table_reset boolean,
  remaining_seated_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_game_id uuid := p_game_id;
  v_table_id uuid;
  v_remaining_seated_count integer;
  v_table_reset boolean := false;
  v_reset_row_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select g.table_id
  into v_table_id
  from public.games as g
  where g.id = v_game_id
    and g.status = 'finished';

  if not found then
    if exists (
      select 1
      from public.games as g
      where g.id = v_game_id
    ) then
      raise exception 'game_not_finished';
    end if;

    raise exception 'game_not_found';
  end if;

  if v_table_id is null then
    raise exception 'table_not_found';
  end if;

  if not exists (
    select 1
    from public.game_players as gp
    where gp.game_id = v_game_id
      and gp.player_id = v_user_id
  ) then
    raise exception 'not_game_participant';
  end if;

  if not exists (
    select 1
    from public.table_seats as ts
    where ts.table_id = v_table_id
      and ts.player_id = v_user_id
  ) then
    raise exception 'not_seated';
  end if;

  update public.table_seats as ts
  set player_id = null,
      is_ready = false,
      joined_at = null,
      last_seen_at = null,
      updated_at = now()
  where ts.table_id = v_table_id
    and ts.player_id = v_user_id;

  select count(ts.player_id)::integer
  into v_remaining_seated_count
  from public.table_seats as ts
  where ts.table_id = v_table_id;

  if v_remaining_seated_count = 0 then
    update public.game_tables as gt
    set status = 'waiting',
        current_game_id = null,
        updated_at = now()
    where gt.id = v_table_id
      and gt.current_game_id = v_game_id;

    get diagnostics v_reset_row_count = row_count;
    v_table_reset := v_reset_row_count > 0;
  end if;

  return query
  select
    v_game_id as game_id,
    v_table_id as table_id,
    v_table_reset as table_reset,
    v_remaining_seated_count as remaining_seated_count;
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
  from public.game_tables as gt
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
        'lastSeenAt', ts.last_seen_at,
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
  from public.table_seats as ts
  left join public.profiles as p on p.id = ts.player_id
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

create or replace function public.heartbeat_game_presence(p_game_id uuid)
returns table (
  game_id uuid,
  player_id uuid,
  last_seen_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_table_id uuid;
  v_seen_at timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select g.table_id
  into v_table_id
  from public.games as g
  where g.id = p_game_id;

  if not found then
    raise exception 'game_not_found';
  end if;

  if not exists (
    select 1
    from public.game_players as gp
    where gp.game_id = p_game_id
      and gp.player_id = v_user_id
  ) then
    raise exception 'not_game_participant';
  end if;

  update public.game_players as gp
  set is_connected = true,
      last_seen_at = v_seen_at,
      updated_at = v_seen_at
  where gp.game_id = p_game_id
    and gp.player_id = v_user_id;

  update public.table_seats as ts
  set last_seen_at = v_seen_at,
      updated_at = v_seen_at
  where ts.table_id = v_table_id
    and ts.player_id = v_user_id;

  return query
  select p_game_id, v_user_id, v_seen_at;
end;
$$;

create or replace function public.heartbeat_table_presence(p_table_id uuid)
returns table (
  table_id uuid,
  player_id uuid,
  last_seen_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_seen_at timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1
    from public.game_tables as gt
    where gt.id = p_table_id
  ) then
    raise exception 'table_not_found';
  end if;

  if not exists (
    select 1
    from public.table_seats as ts
    where ts.table_id = p_table_id
      and ts.player_id = v_user_id
  ) then
    raise exception 'not_seated';
  end if;

  update public.table_seats as ts
  set last_seen_at = v_seen_at,
      updated_at = v_seen_at
  where ts.table_id = p_table_id
    and ts.player_id = v_user_id;

  return query
  select p_table_id, v_user_id, v_seen_at;
end;
$$;

create or replace function public.mark_stale_players(p_game_id uuid)
returns table(stale_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_stale_count integer := 0;
  v_threshold timestamptz := now() - interval '45 seconds';
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1
    from public.games as g
    where g.id = p_game_id
  ) then
    raise exception 'game_not_found';
  end if;

  if not exists (
    select 1
    from public.game_players as gp
    where gp.game_id = p_game_id
      and gp.player_id = v_user_id
  ) then
    raise exception 'not_game_participant';
  end if;

  update public.game_players as gp
  set is_connected = (gp.last_seen_at >= v_threshold),
      updated_at = now()
  where gp.game_id = p_game_id
    and gp.is_connected is distinct from (gp.last_seen_at >= v_threshold);

  select count(*)::integer
  into v_stale_count
  from public.game_players as gp
  where gp.game_id = p_game_id
    and gp.last_seen_at < v_threshold;

  return query
  select v_stale_count;
end;
$$;

-- Dev/admin-only helper. This is intentionally not granted to authenticated users.
create or replace function public.cleanup_abandoned_waiting_tables()
returns table (
  cleaned_seat_count integer,
  reset_table_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cleaned_seat_count integer := 0;
  v_reset_table_count integer := 0;
begin
  update public.table_seats as ts
  set player_id = null,
      is_ready = false,
      joined_at = null,
      last_seen_at = null,
      updated_at = now()
  from public.game_tables as gt
  where gt.id = ts.table_id
    and gt.status in ('waiting', 'full')
    and ts.player_id is not null
    and coalesce(ts.last_seen_at, ts.joined_at, ts.updated_at)
      < now() - interval '5 minutes';

  get diagnostics v_cleaned_seat_count = row_count;

  update public.game_tables as gt
  set status = 'waiting',
      updated_at = now()
  where gt.status = 'full'
    and (
      select count(*)
      from public.table_seats as ts
      where ts.table_id = gt.id
        and ts.player_id is not null
    ) < gt.max_players;

  get diagnostics v_reset_table_count = row_count;

  return query
  select v_cleaned_seat_count, v_reset_table_count;
end;
$$;

revoke all on function public.join_table(uuid) from public;
revoke all on function public.sit_at_table(uuid, integer) from public;
revoke all on function public.leave_table(uuid) from public;
revoke all on function public.leave_finished_game(uuid) from public;
revoke all on function public.get_table_room(uuid) from public;
revoke all on function public.heartbeat_game_presence(uuid) from public;
revoke all on function public.heartbeat_table_presence(uuid) from public;
revoke all on function public.mark_stale_players(uuid) from public;
revoke all on function public.cleanup_abandoned_waiting_tables() from public;

grant execute on function public.join_table(uuid) to authenticated;
grant execute on function public.sit_at_table(uuid, integer) to authenticated;
grant execute on function public.leave_table(uuid) to authenticated;
grant execute on function public.leave_finished_game(uuid) to authenticated;
grant execute on function public.get_table_room(uuid) to authenticated;
grant execute on function public.heartbeat_game_presence(uuid) to authenticated;
grant execute on function public.heartbeat_table_presence(uuid) to authenticated;
grant execute on function public.mark_stale_players(uuid) to authenticated;
