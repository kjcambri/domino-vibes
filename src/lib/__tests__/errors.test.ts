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

  it('explains when the active game rejoin flow cannot locate the game', () => {
    expect(getFriendlyAuthError(new Error('failed_to_rejoin_game'))).toBe(
      'Could not rejoin that game. Try returning from the lobby again.',
    )
  })

  it('maps Supabase email rate limits to confirmation resend guidance', () => {
    expect(
      getFriendlyAuthError({
        message: 'For security purposes, you can only request this once every 60 seconds',
      }),
    ).toBe(
      'Confirmation email could not be sent right now. Please wait a few minutes and try resending.',
    )
  })

  it('maps email provider delivery errors to confirmation resend guidance', () => {
    expect(
      getFriendlyAuthError({
        message: 'Error sending confirmation email through SMTP provider',
      }),
    ).toBe(
      'Confirmation email could not be sent right now. Please wait a few minutes and try resending.',
    )
  })

  it('maps unconfirmed account errors to a resend-friendly message', () => {
    expect(getFriendlyAuthError(new Error('Email not confirmed'))).toBe(
      'Please confirm your email before logging in. You can resend the confirmation email from sign up.',
    )
  })

  it('maps invalid email errors to a safe form message', () => {
    expect(
      getFriendlyAuthError(new Error('Unable to validate email address: invalid format')),
    ).toBe('Enter a valid email address.')
  })
})
