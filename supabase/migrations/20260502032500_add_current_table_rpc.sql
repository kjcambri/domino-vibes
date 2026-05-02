create or replace function public.get_my_current_table()
returns table(
  table_id uuid,
  table_name text,
  game_mode text,
  status text,
  seat_number integer,
  joined_at timestamptz,
  current_game_id uuid
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

  return query
  select
    gt.id as table_id,
    gt.name as table_name,
    gt.game_mode,
    gt.status,
    ts.seat_number,
    ts.joined_at,
    gt.current_game_id
  from public.table_seats ts
  join public.game_tables gt on gt.id = ts.table_id
  where ts.player_id = v_user_id
    and gt.status in ('waiting', 'full', 'in_game')
  order by ts.joined_at desc nulls last, gt.created_at desc
  limit 1;
end;
$$;

revoke all on function public.get_my_current_table() from public;
grant execute on function public.get_my_current_table() to authenticated;
