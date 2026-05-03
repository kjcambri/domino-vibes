-- Sprint 10 patch: ensure the board-state reset helper exists remotely.
-- Some environments received start_next_round without the Sprint 9 helper it calls.

create or replace function public.domino_create_initial_board_state()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'placements', '[]'::jsonb,
    'openEnds', jsonb_build_object(
      'left', null,
      'right', null
    ),
    'visual', jsonb_build_object(
      'leftEndpoint', null,
      'rightEndpoint', null,
      'bounds', jsonb_build_object(
        'minX', -240,
        'maxX', 240,
        'minY', -260,
        'maxY', 260
      )
    )
  );
$$;
