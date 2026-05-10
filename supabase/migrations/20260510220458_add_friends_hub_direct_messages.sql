-- Sprint 28: friends hub, mutual requests, direct messages, and safe friend spectating.

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  responded_at timestamptz null,
  removed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self_check check (requester_id <> addressee_id),
  constraint friendships_status_check check (
    status in ('pending', 'accepted', 'declined', 'removed')
  )
);

create unique index if not exists friendships_user_pair_unique
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );
create index if not exists friendships_requester_idx
  on public.friendships(requester_id);
create index if not exists friendships_addressee_idx
  on public.friendships(addressee_id);
create index if not exists friendships_status_idx
  on public.friendships(status);

create table if not exists public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.friendships enable row level security;
alter table public.user_presence enable row level security;

drop trigger if exists set_friendships_updated_at on public.friendships;
create trigger set_friendships_updated_at
  before update on public.friendships
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_user_presence_updated_at on public.user_presence;
create trigger set_user_presence_updated_at
  before update on public.user_presence
  for each row
  execute function public.set_updated_at();

create or replace function public.users_are_friends(
  p_left_user_id uuid,
  p_right_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friendships as f
    where f.status = 'accepted'
      and (
        (f.requester_id = p_left_user_id and f.addressee_id = p_right_user_id)
        or (f.requester_id = p_right_user_id and f.addressee_id = p_left_user_id)
      )
  );
$$;

revoke all on function public.users_are_friends(uuid, uuid) from public;
grant execute on function public.users_are_friends(uuid, uuid) to authenticated;

drop policy if exists "Users can read their friendships" on public.friendships;
create policy "Users can read their friendships"
  on public.friendships
  for select
  to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists "Users can read friend presence" on public.user_presence;
create policy "Users can read friend presence"
  on public.user_presence
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.users_are_friends(user_id, auth.uid())
  );

grant select on public.friendships to authenticated;
grant select on public.user_presence to authenticated;

create or replace function public.search_friend_candidates(
  p_query text,
  p_limit integer default 20
)
returns table (
  profile_id uuid,
  username text,
  display_name text,
  avatar_url text,
  friendship_id uuid,
  relationship_status text,
  relationship_direction text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_query text := lower(regexp_replace(btrim(coalesce(p_query, '')), '\s+', ' ', 'g'));
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 30);
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if char_length(v_query) < 2 then
    return;
  end if;

  return query
  select
    p.id as profile_id,
    p.username,
    p.display_name,
    p.avatar_url,
    f.id as friendship_id,
    case
      when f.id is null or f.status in ('declined', 'removed') then 'none'
      else f.status
    end as relationship_status,
    case
      when f.id is null or f.status in ('declined', 'removed') then 'none'
      when f.status = 'accepted' then 'friend'
      when f.requester_id = v_user_id then 'outgoing'
      else 'incoming'
    end as relationship_direction
  from public.profiles as p
  left join public.friendships as f
    on (
      (f.requester_id = v_user_id and f.addressee_id = p.id)
      or (f.requester_id = p.id and f.addressee_id = v_user_id)
    )
  where p.id <> v_user_id
    and (
      lower(p.username) like v_query || '%'
      or lower(p.display_name) like '%' || v_query || '%'
    )
  order by
    case when f.status = 'accepted' then 0 else 1 end,
    lower(p.display_name),
    lower(p.username)
  limit v_limit;
end;
$$;

create or replace function public.send_friend_request(p_addressee_id uuid)
returns table (
  id uuid,
  requester_id uuid,
  addressee_id uuid,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_friendship public.friendships%rowtype;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if v_user_id = p_addressee_id then
    raise exception 'cannot_friend_self';
  end if;

  if not public.user_has_profile(v_user_id) then
    raise exception 'profile_required';
  end if;

  if not exists (
    select 1 from public.profiles as p where p.id = p_addressee_id
  ) then
    raise exception 'friend_profile_not_found';
  end if;

  select f.*
  into v_friendship
  from public.friendships as f
  where (
    (f.requester_id = v_user_id and f.addressee_id = p_addressee_id)
    or (f.requester_id = p_addressee_id and f.addressee_id = v_user_id)
  )
  for update;

  if found then
    if v_friendship.status = 'accepted' then
      raise exception 'already_friends';
    end if;

    if v_friendship.status = 'pending' then
      raise exception 'friend_request_pending';
    end if;

    update public.friendships as f
    set requester_id = v_user_id,
        addressee_id = p_addressee_id,
        status = 'pending',
        requested_at = now(),
        responded_at = null,
        removed_at = null
    where f.id = v_friendship.id
    returning f.* into v_friendship;
  else
    insert into public.friendships (requester_id, addressee_id, status)
    values (v_user_id, p_addressee_id, 'pending')
    returning * into v_friendship;
  end if;

  return query
  select
    v_friendship.id,
    v_friendship.requester_id,
    v_friendship.addressee_id,
    v_friendship.status,
    v_friendship.created_at,
    v_friendship.updated_at;
end;
$$;

create or replace function public.respond_friend_request(
  p_friendship_id uuid,
  p_accept boolean
)
returns table (
  id uuid,
  requester_id uuid,
  addressee_id uuid,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_friendship public.friendships%rowtype;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select f.*
  into v_friendship
  from public.friendships as f
  where f.id = p_friendship_id
  for update;

  if not found then
    raise exception 'friend_request_not_found';
  end if;

  if v_friendship.addressee_id <> v_user_id then
    raise exception 'friend_request_access_denied';
  end if;

  if v_friendship.status <> 'pending' then
    raise exception 'friend_request_not_pending';
  end if;

  update public.friendships as f
  set status = case when p_accept then 'accepted' else 'declined' end,
      responded_at = now(),
      removed_at = null
  where f.id = p_friendship_id
  returning f.* into v_friendship;

  return query
  select
    v_friendship.id,
    v_friendship.requester_id,
    v_friendship.addressee_id,
    v_friendship.status,
    v_friendship.created_at,
    v_friendship.updated_at;
end;
$$;

create or replace function public.cancel_friend_request(p_friendship_id uuid)
returns table (
  id uuid,
  requester_id uuid,
  addressee_id uuid,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_friendship public.friendships%rowtype;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select f.*
  into v_friendship
  from public.friendships as f
  where f.id = p_friendship_id
  for update;

  if not found then
    raise exception 'friend_request_not_found';
  end if;

  if v_friendship.requester_id <> v_user_id then
    raise exception 'friend_request_access_denied';
  end if;

  if v_friendship.status <> 'pending' then
    raise exception 'friend_request_not_pending';
  end if;

  update public.friendships as f
  set status = 'removed',
      removed_at = now()
  where f.id = p_friendship_id
  returning f.* into v_friendship;

  return query
  select
    v_friendship.id,
    v_friendship.requester_id,
    v_friendship.addressee_id,
    v_friendship.status,
    v_friendship.created_at,
    v_friendship.updated_at;
end;
$$;

create or replace function public.remove_friend(p_friendship_id uuid)
returns table (
  id uuid,
  requester_id uuid,
  addressee_id uuid,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_friendship public.friendships%rowtype;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select f.*
  into v_friendship
  from public.friendships as f
  where f.id = p_friendship_id
  for update;

  if not found then
    raise exception 'friendship_not_found';
  end if;

  if v_friendship.requester_id <> v_user_id and v_friendship.addressee_id <> v_user_id then
    raise exception 'friendship_access_denied';
  end if;

  if v_friendship.status <> 'accepted' then
    raise exception 'friendship_not_accepted';
  end if;

  update public.friendships as f
  set status = 'removed',
      removed_at = now()
  where f.id = p_friendship_id
  returning f.* into v_friendship;

  return query
  select
    v_friendship.id,
    v_friendship.requester_id,
    v_friendship.addressee_id,
    v_friendship.status,
    v_friendship.created_at,
    v_friendship.updated_at;
end;
$$;

create or replace function public.heartbeat_user_presence()
returns table (
  user_id uuid,
  last_seen_at timestamptz
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

  if not public.user_has_profile(v_user_id) then
    raise exception 'profile_required';
  end if;

  return query
  insert into public.user_presence as up (user_id, last_seen_at)
  values (v_user_id, now())
  on conflict (user_id)
  do update set last_seen_at = excluded.last_seen_at
  returning up.user_id, up.last_seen_at;
end;
$$;

create or replace function public.get_friends_hub()
returns jsonb
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

  if not public.user_has_profile(v_user_id) then
    raise exception 'profile_required';
  end if;

  return jsonb_build_object(
    'friends',
    coalesce(
      (
        select jsonb_agg(friend_payload order by sort_name)
        from (
          select
            lower(coalesce(fp.display_name, fp.username)) as sort_name,
            jsonb_build_object(
              'friendshipId', f.id,
              'friendId', fp.id,
              'username', fp.username,
              'displayName', fp.display_name,
              'avatarUrl', fp.avatar_url,
              'joinedAt', f.responded_at,
              'levelLabel', 'Beta member',
              'presenceStatus', case
                when up.last_seen_at is null then 'offline'
                when up.last_seen_at > now() - interval '2 minutes' then 'online'
                when up.last_seen_at > now() - interval '10 minutes' then 'away'
                else 'offline'
              end,
              'lastSeenAt', up.last_seen_at,
              'statusLabel', case
                when activity.table_status = 'in_game' and activity.current_game_id is not null
                  then 'Playing ' || activity.table_name
                when activity.table_status in ('waiting', 'full')
                  then 'At ' || activity.table_name
                when up.last_seen_at > now() - interval '2 minutes'
                  then 'Active now'
                when up.last_seen_at > now() - interval '10 minutes'
                  then 'Away'
                else 'Offline'
              end,
              'tableId', activity.table_id,
              'tableName', activity.table_name,
              'tableStatus', activity.table_status,
              'gameId', activity.current_game_id,
              'gameStatus', activity.current_game_status,
              'joinTableId', case
                when activity.table_status = 'waiting'
                  and activity.seated_count < activity.max_players
                  then activity.table_id
                else null
              end,
              'spectateGameId', case
                when activity.table_status = 'in_game'
                  and activity.current_game_id is not null
                  then activity.current_game_id
                else null
              end
            ) as friend_payload
          from public.friendships as f
          join public.profiles as fp
            on fp.id = case
              when f.requester_id = v_user_id then f.addressee_id
              else f.requester_id
            end
          left join public.user_presence as up on up.user_id = fp.id
          left join lateral (
            select
              gt.id as table_id,
              gt.name as table_name,
              gt.status as table_status,
              gt.max_players,
              gt.current_game_id,
              g.status as current_game_status,
              (
                select count(*)::integer
                from public.table_seats as occupied
                where occupied.table_id = gt.id
                  and occupied.player_id is not null
              ) as seated_count
            from public.table_seats as ts
            join public.game_tables as gt on gt.id = ts.table_id
            left join public.games as g on g.id = gt.current_game_id
            where ts.player_id = fp.id
              and gt.status in ('waiting', 'full', 'in_game')
            order by ts.joined_at desc nulls last, gt.updated_at desc
            limit 1
          ) as activity on true
          where f.status = 'accepted'
            and (f.requester_id = v_user_id or f.addressee_id = v_user_id)
        ) as friends
      ),
      '[]'::jsonb
    ),
    'incomingRequests',
    coalesce(
      (
        select jsonb_agg(request_payload order by requested_at desc)
        from (
          select
            f.requested_at,
            jsonb_build_object(
              'friendshipId', f.id,
              'profileId', p.id,
              'username', p.username,
              'displayName', p.display_name,
              'avatarUrl', p.avatar_url,
              'requestedAt', f.requested_at,
              'direction', 'incoming'
            ) as request_payload
          from public.friendships as f
          join public.profiles as p on p.id = f.requester_id
          where f.addressee_id = v_user_id
            and f.status = 'pending'
        ) as incoming
      ),
      '[]'::jsonb
    ),
    'outgoingRequests',
    coalesce(
      (
        select jsonb_agg(request_payload order by requested_at desc)
        from (
          select
            f.requested_at,
            jsonb_build_object(
              'friendshipId', f.id,
              'profileId', p.id,
              'username', p.username,
              'displayName', p.display_name,
              'avatarUrl', p.avatar_url,
              'requestedAt', f.requested_at,
              'direction', 'outgoing'
            ) as request_payload
          from public.friendships as f
          join public.profiles as p on p.id = f.addressee_id
          where f.requester_id = v_user_id
            and f.status = 'pending'
        ) as outgoing
      ),
      '[]'::jsonb
    )
  );
end;
$$;

create or replace function public.get_spectator_game_room(p_game_id uuid)
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
  v_move_count integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not public.user_has_profile(v_user_id) then
    raise exception 'profile_required';
  end if;

  select g.*
  into v_game
  from public.games as g
  where g.id = p_game_id;

  if not found then
    raise exception 'game_not_found';
  end if;

  if v_game.status <> 'active' then
    raise exception 'game_not_active';
  end if;

  if not exists (
    select 1
    from public.game_players as gp
    where gp.game_id = p_game_id
      and public.users_are_friends(v_user_id, gp.player_id)
  ) then
    raise exception 'spectator_access_denied';
  end if;

  select gt.*
  into v_table
  from public.game_tables as gt
  where gt.id = v_game.table_id;

  select count(*)::integer
  into v_move_count
  from public.game_moves as gm
  where gm.game_id = p_game_id;

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
        'avatarUrl', p.avatar_url,
        'isFriend', public.users_are_friends(v_user_id, gp.player_id)
      )
      order by gp.turn_order
    ),
    '[]'::jsonb
  )
  into v_players
  from public.game_players as gp
  left join public.profiles as p on p.id = gp.player_id
  left join public.game_player_hands as gph
    on gph.game_id = gp.game_id
   and gph.player_id = gp.player_id
  where gp.game_id = p_game_id;

  return jsonb_build_object(
    'game', jsonb_build_object(
      'id', v_game.id,
      'tableId', v_game.table_id,
      'tableName', v_table.name,
      'gameMode', v_game.game_mode,
      'status', v_game.status,
      'currentRoundNumber', v_game.current_round_number,
      'currentTurnPlayerId', v_game.current_turn_player_id,
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
      'moveCount', v_move_count,
      'winnerPlayerId', v_game.winner_player_id,
      'endedReason', v_game.ended_reason,
      'startedAt', v_game.started_at,
      'finishedAt', v_game.finished_at
    ),
    'players', v_players
  );
end;
$$;

alter table public.chat_messages
  drop constraint if exists chat_messages_room_type_check;
alter table public.chat_messages
  add constraint chat_messages_room_type_check check (
    room_type in ('lobby', 'table', 'game', 'direct')
  );

alter table public.chat_messages
  drop constraint if exists chat_messages_room_id_check;
alter table public.chat_messages
  add constraint chat_messages_room_id_check check (
    (room_type = 'lobby' and room_id is null)
    or (room_type in ('table', 'game', 'direct') and room_id is not null)
  );

create or replace function public.chat_user_can_access_room(
  p_room_type text,
  p_room_id uuid,
  p_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select case
    when p_user_id is null then false
    when p_room_type = 'lobby' then p_room_id is null
    when p_room_type = 'table' then p_room_id is not null and exists (
      select 1
      from public.table_seats as ts
      where ts.table_id = p_room_id
        and ts.player_id = p_user_id
    )
    when p_room_type = 'game' then p_room_id is not null and public.user_is_game_participant(p_room_id, p_user_id)
    when p_room_type = 'direct' then p_room_id is not null and exists (
      select 1
      from public.friendships as f
      where f.id = p_room_id
        and f.status = 'accepted'
        and (f.requester_id = p_user_id or f.addressee_id = p_user_id)
    )
    else false
  end;
$$;

create or replace function public.send_chat_message(
  p_room_type text,
  p_room_id uuid,
  p_body text,
  p_client_message_id text default null
)
returns table (
  id uuid,
  room_type text,
  room_id uuid,
  sender_id uuid,
  sender_display_name text,
  body text,
  is_system boolean,
  is_deleted boolean,
  deleted_at timestamptz,
  client_message_id text,
  metadata jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_display_name text;
  v_body text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  v_display_name := public.chat_sender_display_name(v_user_id);

  if v_display_name is null then
    raise exception 'profile_required';
  end if;

  if p_room_type not in ('lobby', 'table', 'game', 'direct') then
    raise exception 'invalid_chat_room_type';
  end if;

  if p_room_type = 'lobby' and p_room_id is not null then
    raise exception 'invalid_chat_room';
  end if;

  if p_room_type in ('table', 'game', 'direct') and p_room_id is null then
    raise exception 'invalid_chat_room';
  end if;

  if not public.chat_user_can_access_room(p_room_type, p_room_id, v_user_id) then
    if p_room_type = 'direct' then
      raise exception 'direct_chat_access_denied';
    end if;

    raise exception 'chat_room_access_denied';
  end if;

  v_body := regexp_replace(btrim(coalesce(p_body, '')), '\s+', ' ', 'g');

  if char_length(v_body) = 0 then
    raise exception 'chat_message_empty';
  end if;

  if char_length(v_body) > 500 then
    raise exception 'chat_message_too_long';
  end if;

  if exists (
    select 1
    from public.chat_messages as cm
    where cm.sender_id = v_user_id
      and cm.created_at > now() - interval '1 second'
  ) then
    raise exception 'chat_rate_limited';
  end if;

  return query
  insert into public.chat_messages as cm (
    room_type,
    room_id,
    sender_id,
    sender_display_name,
    body,
    is_system,
    client_message_id
  )
  values (
    p_room_type,
    p_room_id,
    v_user_id,
    v_display_name,
    v_body,
    false,
    nullif(btrim(p_client_message_id), '')
  )
  returning
    cm.id,
    cm.room_type,
    cm.room_id,
    cm.sender_id,
    cm.sender_display_name,
    cm.body,
    cm.is_system,
    cm.is_deleted,
    cm.deleted_at,
    cm.client_message_id,
    cm.metadata,
    cm.created_at;
end;
$$;

create or replace function public.get_chat_messages(
  p_room_type text,
  p_room_id uuid,
  p_limit integer default 50
)
returns table (
  id uuid,
  room_type text,
  room_id uuid,
  sender_id uuid,
  sender_display_name text,
  body text,
  is_system boolean,
  is_deleted boolean,
  deleted_at timestamptz,
  client_message_id text,
  metadata jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_room_type not in ('lobby', 'table', 'game', 'direct') then
    raise exception 'invalid_chat_room_type';
  end if;

  if p_room_type = 'lobby' and p_room_id is not null then
    raise exception 'invalid_chat_room';
  end if;

  if p_room_type in ('table', 'game', 'direct') and p_room_id is null then
    raise exception 'invalid_chat_room';
  end if;

  if not public.chat_user_can_access_room(p_room_type, p_room_id, v_user_id) then
    if p_room_type = 'direct' then
      raise exception 'direct_chat_access_denied';
    end if;

    raise exception 'chat_room_access_denied';
  end if;

  return query
  select *
  from (
    select
      cm.id,
      cm.room_type,
      cm.room_id,
      cm.sender_id,
      cm.sender_display_name,
      case when cm.is_deleted then 'Message deleted' else cm.body end as body,
      cm.is_system,
      cm.is_deleted,
      cm.deleted_at,
      cm.client_message_id,
      cm.metadata,
      cm.created_at
    from public.chat_messages as cm
    where cm.room_type = p_room_type
      and (
        (p_room_type = 'lobby' and cm.room_id is null)
        or (p_room_type in ('table', 'game', 'direct') and cm.room_id = p_room_id)
      )
    order by cm.created_at desc
    limit v_limit
  ) as recent_messages
  order by recent_messages.created_at asc;
end;
$$;

revoke all on function public.search_friend_candidates(text, integer) from public;
revoke all on function public.send_friend_request(uuid) from public;
revoke all on function public.respond_friend_request(uuid, boolean) from public;
revoke all on function public.cancel_friend_request(uuid) from public;
revoke all on function public.remove_friend(uuid) from public;
revoke all on function public.heartbeat_user_presence() from public;
revoke all on function public.get_friends_hub() from public;
revoke all on function public.get_spectator_game_room(uuid) from public;
revoke all on function public.chat_user_can_access_room(text, uuid, uuid) from public;
revoke all on function public.send_chat_message(text, uuid, text, text) from public;
revoke all on function public.get_chat_messages(text, uuid, integer) from public;

grant execute on function public.search_friend_candidates(text, integer) to authenticated;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.cancel_friend_request(uuid) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.heartbeat_user_presence() to authenticated;
grant execute on function public.get_friends_hub() to authenticated;
grant execute on function public.get_spectator_game_room(uuid) to authenticated;
grant execute on function public.chat_user_can_access_room(text, uuid, uuid) to authenticated;
grant execute on function public.send_chat_message(text, uuid, text, text) to authenticated;
grant execute on function public.get_chat_messages(text, uuid, integer) to authenticated;

alter table public.friendships replica identity full;
alter table public.user_presence replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.friendships;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.user_presence;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;
