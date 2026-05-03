-- DEV ONLY: clears stale waiting/full table seats older than 5 minutes.
-- Do not run this in production after real users exist.
-- This script intentionally does not touch in_game tables or game history.

begin;

update public.table_seats as ts
set
  player_id = null,
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

update public.game_tables as gt
set
  status = 'waiting',
  updated_at = now()
where gt.status = 'full'
  and (
    select count(*)
    from public.table_seats as ts
    where ts.table_id = gt.id
      and ts.player_id is not null
  ) < gt.max_players;

commit;

-- If you applied Sprint 12 migrations, this equivalent helper is also available
-- to database owners/service-role SQL sessions:
--
-- select * from public.cleanup_abandoned_waiting_tables();
