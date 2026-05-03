-- Sprint 11 patch: release seats after a finished game.
-- Keeps game history intact while allowing the table to become reusable.

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

revoke all on function public.leave_finished_game(uuid) from public;
grant execute on function public.leave_finished_game(uuid) to authenticated;
