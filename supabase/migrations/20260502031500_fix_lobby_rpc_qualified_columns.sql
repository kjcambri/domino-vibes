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
  select gt.max_players, gt.status
  into v_max_players, v_current_status
  from public.game_tables gt
  where gt.id = p_table_id;

  if v_current_status in ('in_game', 'finished', 'closed') then
    return;
  end if;

  select count(*)
  into v_seated_count
  from public.table_seats ts
  where ts.table_id = p_table_id
    and ts.player_id is not null;

  update public.game_tables gt
  set status = case
    when v_seated_count >= v_max_players then 'full'
    else 'waiting'
  end
  where gt.id = p_table_id;
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

  select ts.*
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

  update public.table_seats ts
  set player_id = v_user_id,
      is_ready = false,
      joined_at = now()
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
  from public.game_tables gt
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
    from public.table_seats ts
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

  update public.table_seats ts
  set player_id = v_user_id,
      is_ready = false,
      joined_at = now()
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
  from public.game_tables gt
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
  from public.table_seats ts
  where ts.table_id = p_table_id
    and ts.player_id = v_user_id
  for update;

  if not found then
    raise exception 'not_seated';
  end if;

  update public.table_seats ts
  set player_id = null,
      is_ready = false,
      joined_at = null
  where ts.id = v_seat_id;

  perform public.set_table_status_from_seats(p_table_id);

  return query
  select p_table_id;
end;
$$;
