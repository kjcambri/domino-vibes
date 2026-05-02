export function getFriendlyAuthError(error: unknown) {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error)

  if (message.includes('invalid login credentials')) {
    return 'That email and password do not match. Try again.'
  }

  if (message.includes('user already registered')) {
    return 'That email is already registered. Try logging in instead.'
  }

  if (message.includes('email signups are disabled')) {
    return 'Email signups are disabled in Supabase. Enable the Email provider to create accounts.'
  }

  if (message.includes('password')) {
    return 'Use a stronger password with at least 6 characters.'
  }

  if (message.includes('profiles_username_key')) {
    return 'That username is already taken. Try another one.'
  }

  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Network trouble reached the table. Check your connection and try again.'
  }

  if (message.includes('supabase is not configured')) {
    return 'Supabase is not configured yet. Add your local environment values first.'
  }

  return 'Something went wrong. Please try again.'
}
