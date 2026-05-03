import { describe, expect, it } from 'vitest'
import { getFriendlyAuthError } from '../errors'

describe('getFriendlyAuthError', () => {
  it('explains when a next round cannot start before the current round is finished', () => {
    expect(getFriendlyAuthError(new Error('round_not_finished'))).toBe(
      'The next round can only start after this round is complete.',
    )
  })

  it('reads Supabase plain-object errors instead of hiding them behind a generic message', () => {
    expect(
      getFriendlyAuthError({
        message:
          'Could not find the function public.start_next_round(p_game_id) in the schema cache',
        code: 'PGRST202',
      }),
    ).toBe(
      'Start Next Round is not installed in Supabase yet. Apply the latest migration.',
    )
  })
})
