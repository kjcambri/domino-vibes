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

  it('explains when the next round is blocked because the game has ended', () => {
    expect(getFriendlyAuthError(new Error('game_finished'))).toBe(
      'This game is already finished.',
    )
  })

  it('explains when a finished-game lobby return is attempted before the game ends', () => {
    expect(getFriendlyAuthError(new Error('game_not_finished'))).toBe(
      'Return to the lobby after the game is finished.',
    )
  })
})
