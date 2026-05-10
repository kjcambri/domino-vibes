import { describe, expect, it } from 'vitest'
import { avatarPresets } from '../avatarPresets'
import { normalizeProfileForm, validateProfileForm } from '../profileForm'

describe('profile form helpers', () => {
  it('normalizes username and display name before saving', () => {
    expect(
      normalizeProfileForm({
        avatarUrl: avatarPresets[0]?.url,
        displayName: '  Kevon  ',
        username: '  Domino_King  ',
      }),
    ).toEqual({
      avatarUrl: avatarPresets[0]?.url,
      displayName: 'Kevon',
      username: 'domino_king',
    })
  })

  it('accepts valid profile values with a curated avatar preset', () => {
    expect(
      validateProfileForm({
        avatarUrl: avatarPresets[1]?.url,
        displayName: 'Table Captain',
        username: 'captain_6',
      }),
    ).toBeNull()
  })

  it('rejects invalid usernames and display names', () => {
    expect(
      validateProfileForm({
        displayName: 'K',
        username: 'No Spaces',
      }),
    ).toBe('Username must be 3 to 20 letters, numbers, or underscores.')

    expect(
      validateProfileForm({
        displayName: 'K',
        username: 'kev',
      }),
    ).toBe('Display name must be 2 to 40 characters.')
  })

  it('rejects avatar urls outside the preset list', () => {
    expect(
      validateProfileForm({
        avatarUrl: 'https://example.com/avatar.svg',
        displayName: 'Kevon',
        username: 'kevon',
      }),
    ).toBe('Choose one of the available avatar presets.')
  })
})
