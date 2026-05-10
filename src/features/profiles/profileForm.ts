import { isAvatarPresetUrl } from './avatarPresets'

export type ProfileFormInput = {
  username: string
  displayName: string
  avatarUrl?: string | null
}

export const usernamePattern = /^[a-z0-9_]+$/

export function normalizeProfileForm(input: ProfileFormInput) {
  return {
    username: input.username.trim().toLowerCase(),
    displayName: input.displayName.trim(),
    avatarUrl: input.avatarUrl ?? null,
  }
}

export function validateProfileForm(input: ProfileFormInput) {
  const normalized = normalizeProfileForm(input)

  if (!normalized.username) {
    return 'Username is required.'
  }

  if (
    normalized.username.length < 3 ||
    normalized.username.length > 20 ||
    !usernamePattern.test(normalized.username)
  ) {
    return 'Username must be 3 to 20 letters, numbers, or underscores.'
  }

  if (
    normalized.displayName.length < 2 ||
    normalized.displayName.length > 40
  ) {
    return 'Display name must be 2 to 40 characters.'
  }

  if (!isAvatarPresetUrl(normalized.avatarUrl)) {
    return 'Choose one of the available avatar presets.'
  }

  return null
}
