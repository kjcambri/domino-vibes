import { describe, expect, it } from 'vitest'
import {
  getAuthCallbackUrl,
  getSignupResult,
} from '../authService'

describe('authService signup helpers', () => {
  it('uses the auth callback route for Supabase email redirects', () => {
    expect(getAuthCallbackUrl('https://dominovibes.com/signup')).toBe(
      'https://dominovibes.com/auth/callback',
    )
  })

  it('recognizes confirmation-required signup success', () => {
    expect(
      getSignupResult({
        user: { id: 'user-1' },
        session: null,
      }),
    ).toEqual({
      status: 'confirmation_required',
      message:
        'Account created. Please check your email to confirm your account before logging in.',
    })
  })

  it('recognizes immediate session signup success', () => {
    expect(
      getSignupResult({
        user: { id: 'user-1' },
        session: { access_token: 'token' },
      }),
    ).toEqual({
      status: 'signed_in',
      message: 'Account created. Opening your profile setup.',
    })
  })
})
