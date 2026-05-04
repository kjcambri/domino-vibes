-- Sprint 15: MVP lobby/table/game chat.
-- Chat is text-only, room-scoped, and server-controlled for sender identity.

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_type text not null,
  room_id uuid null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_display_name text not null,
  body text not null,
  is_system boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamptz null,
  client_message_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint chat_messages_room_type_check check (
    room_type in ('lobby', 'table', 'game')
  ),
  constraint chat_messages_body_length_check check (
    char_length(btrim(body)) > 0 and char_length(body) <= 500
  ),
  constraint chat_messages_room_id_check check (
    (room_type = 'lobby' and room_id is null)
    or (room_type in ('table', 'game') and room_id is not null)
  ),
  constraint chat_messages_metadata_object_check check (
    jsonb_typeof(metadata) = 'object'
  )
);

create index if not exists chat_messages_room_created_idx
  on public.chat_messages(room_type, room_id, created_at desc);
create index if not exists chat_messages_sender_id_idx
  on public.chat_messages(sender_id);
create index if not exists chat_messages_created_at_idx
  on public.chat_messages(created_at desc);

alter table public.chat_messages enable row level security;

create or replace function public.chat_sender_display_name(p_user_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce(nullif(btrim(p.display_name), ''), p.username)
  from public.profiles as p
  where p.id = p_user_id;
$$;

revoke all on function public.chat_sender_display_name(uuid) from public;
grant execute on function public.chat_sender_display_name(uuid) to authenticated;

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
    else false
  end;
$$;

revoke all on function public.chat_user_can_access_room(text, uuid, uuid) from public;
grant execute on function public.chat_user_can_access_room(text, uuid, uuid) to authenticated;

drop policy if exists "Authenticated users can read accessible chat messages"
  on public.chat_messages;
create policy "Authenticated users can read accessible chat messages"
  on public.chat_messages
  for select
  to authenticated
  using (
    public.chat_user_can_access_room(room_type, room_id, auth.uid())
  );

drop policy if exists "Authenticated users can insert accessible chat messages"
  on public.chat_messages;
create policy "Authenticated users can insert accessible chat messages"
  on public.chat_messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and sender_display_name = public.chat_sender_display_name(auth.uid())
    and is_system = false
    and is_deleted = false
    and deleted_at is null
    and public.chat_user_can_access_room(room_type, room_id, auth.uid())
  );

grant select, insert on public.chat_messages to authenticated;

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

  if p_room_type not in ('lobby', 'table', 'game') then
    raise exception 'invalid_chat_room_type';
  end if;

  if p_room_type = 'lobby' and p_room_id is not null then
    raise exception 'invalid_chat_room';
  end if;

  if p_room_type in ('table', 'game') and p_room_id is null then
    raise exception 'invalid_chat_room';
  end if;

  if not public.chat_user_can_access_room(p_room_type, p_room_id, v_user_id) then
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

revoke all on function public.send_chat_message(text, uuid, text, text) from public;
grant execute on function public.send_chat_message(text, uuid, text, text) to authenticated;

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

  if p_room_type not in ('lobby', 'table', 'game') then
    raise exception 'invalid_chat_room_type';
  end if;

  if p_room_type = 'lobby' and p_room_id is not null then
    raise exception 'invalid_chat_room';
  end if;

  if p_room_type in ('table', 'game') and p_room_id is null then
    raise exception 'invalid_chat_room';
  end if;

  if not public.chat_user_can_access_room(p_room_type, p_room_id, v_user_id) then
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
        or (p_room_type in ('table', 'game') and cm.room_id = p_room_id)
      )
    order by cm.created_at desc
    limit v_limit
  ) as recent_messages
  order by recent_messages.created_at asc;
end;
$$;

revoke all on function public.get_chat_messages(text, uuid, integer) from public;
grant execute on function public.get_chat_messages(text, uuid, integer) to authenticated;

alter table public.chat_messages replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;
