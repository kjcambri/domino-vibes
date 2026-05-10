alter table public.game_tables
  add column if not exists invite_code text null;

create unique index if not exists game_tables_invite_code_key
  on public.game_tables (invite_code)
  where invite_code is not null;

create index if not exists game_tables_private_status_idx
  on public.game_tables (is_system_created, status, created_at);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'game_tables_invite_code_format_check'
      and conrelid = 'public.game_tables'::regclass
  ) then
    alter table public.game_tables
      add constraint game_tables_invite_code_format_check
      check (
        invite_code is null
        or invite_code ~ '^[A-Z0-9]{6,10}$'
      );
  end if;
end;
$$;

drop policy if exists "Authenticated users can read game tables" on public.game_tables;
create policy "Authenticated users can read game tables"
  on public.game_tables
  for select
  to authenticated
  using (
    is_system_created = true
    or created_by = auth.uid()
    or exists (
      select 1
      from public.table_seats ts
      where ts.table_id = game_tables.id
        and ts.player_id = auth.uid()
    )
  );

drop policy if exists "Authenticated users can read table seats" on public.table_seats;
create policy "Authenticated users can read table seats"
  on public.table_seats
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.game_tables gt
      where gt.id = table_seats.table_id
        and (
          gt.is_system_created = true
          or gt.created_by = auth.uid()
          or exists (
            select 1
            from public.table_seats viewer_seat
            where viewer_seat.table_id = table_seats.table_id
              and viewer_seat.player_id = auth.uid()
          )
        )
    )
  );

create or replace function public.normalize_private_invite_code(p_invite_code text)
returns text
language sql
security definer
set search_path = public
as $$
  select upper(regexp_replace(coalesce(p_invite_code, ''), '[^a-zA-Z0-9]', '', 'g'));
$$;

create or replace function public.generate_private_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite_code text;
begin
  loop
    v_invite_code := substring(upper(replace(gen_random_uuid()::text, '-', '')) from 1 for 8);

    exit when not exists (
      select 1
      from public.game_tables gt
      where gt.invite_code = v_invite_code
    );
  end loop;

  return v_invite_code;
end;
$$;

create or replace function public.create_private_table(p_table_name text default null)
returns table(table_id uuid, invite_code text, seat_number integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_table_id uuid;
  v_invite_code text;
  v_table_name text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_user_id;

  if not found then
    raise exception 'profile_required';
  end if;

  if public.user_has_active_seat(v_user_id) then
    raise exception 'already_seated_elsewhere';
  end if;

  v_table_name := nullif(trim(coalesce(p_table_name, '')), '');

  if v_table_name is null then
    v_table_name := coalesce(nullif(trim(v_profile.display_name), ''), v_profile.username) || '''s Private Table';
  end if;

  v_table_name := left(v_table_name, 48);
  v_invite_code := public.generate_private_invite_code();

  insert into public.game_tables (
    name,
    game_mode,
    max_players,
    status,
    is_system_created,
    created_by,
    invite_code
  )
  values (
    v_table_name,
    'cutthroat_4',
    4,
    'waiting',
    false,
    v_user_id,
    v_invite_code
  )
  returning id into v_table_id;

  insert into public.table_seats (table_id, seat_number, player_id, is_ready, joined_at)
  values (v_table_id, 1, v_user_id, false, now());

  insert into public.table_seats (table_id, seat_number)
  select v_table_id, seat_number
  from generate_series(2, 4) as seat_number;

  return query
  select v_table_id, v_invite_code, 1;
end;
$$;

create or replace function public.join_private_table(p_invite_code text)
returns table(table_id uuid, invite_code text, seat_number integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite_code text := public.normalize_private_invite_code(p_invite_code);
  v_table public.game_tables%rowtype;
  v_seat public.table_seats%rowtype;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not public.user_has_profile(v_user_id) then
    raise exception 'profile_required';
  end if;

  if length(v_invite_code) < 6 or length(v_invite_code) > 10 then
    raise exception 'invalid_invite_code';
  end if;

  select *
  into v_table
  from public.game_tables
  where invite_code = v_invite_code
    and is_system_created = false
  for update;

  if not found then
    raise exception 'private_table_not_found';
  end if;

  if v_table.status in ('in_game', 'finished', 'closed') then
    raise exception 'table_unavailable';
  end if;

  if exists (
    select 1
    from public.table_seats ts
    where ts.table_id = v_table.id
      and ts.player_id = v_user_id
  ) then
    return query
    select v_table.id, v_table.invite_code, ts.seat_number
    from public.table_seats ts
    where ts.table_id = v_table.id
      and ts.player_id = v_user_id
    limit 1;
    return;
  end if;

  if public.user_has_active_seat(v_user_id, v_table.id) then
    raise exception 'already_seated_elsewhere';
  end if;

  select *
  into v_seat
  from public.table_seats ts
  where ts.table_id = v_table.id
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

  perform public.set_table_status_from_seats(v_table.id);

  return query
  select v_table.id, v_table.invite_code, v_seat.seat_number;
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

  if v_table.is_system_created = false then
    raise exception 'private_invite_required';
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

  if v_table.is_system_created = false and not exists (
    select 1
    from public.table_seats ts
    where ts.table_id = p_table_id
      and ts.player_id = v_user_id
  ) then
    raise exception 'private_invite_required';
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
  v_is_private boolean;
  v_can_view_private boolean;
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

  v_is_private := v_table.is_system_created = false;
  v_can_view_private := not v_is_private
    or v_table.created_by = v_user_id
    or exists (
      select 1
      from public.table_seats ts
      where ts.table_id = p_table_id
        and ts.player_id = v_user_id
    );

  if not v_can_view_private then
    raise exception 'private_invite_required';
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
      'isPrivate', v_is_private,
      'inviteCode', case when v_is_private then v_table.invite_code else null end,
      'createdAt', v_table.created_at,
      'updatedAt', v_table.updated_at
    ),
    'seats', v_seats
  );
end;
$$;

revoke all on function public.normalize_private_invite_code(text) from public;
revoke all on function public.generate_private_invite_code() from public;
revoke all on function public.create_private_table(text) from public;
revoke all on function public.join_private_table(text) from public;

grant execute on function public.create_private_table(text) to authenticated;
grant execute on function public.join_private_table(text) to authenticated;
