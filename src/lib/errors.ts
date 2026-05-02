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

  if (message.includes('table_full')) {
    return 'That table is full. Choose another waiting table.'
  }

  if (message.includes('table_not_found')) {
    return 'That table could not be found.'
  }

  if (message.includes('already_seated_elsewhere')) {
    return 'You are already seated at another active table. Leave that table first.'
  }

  if (message.includes('already_seated')) {
    return 'You are already seated at this table.'
  }

  if (message.includes('seat_taken')) {
    return 'That seat was just taken. Pick another open seat.'
  }

  if (message.includes('profile_required')) {
    return 'Create your player profile before joining a table.'
  }

  if (message.includes('not_authenticated')) {
    return 'Log in before joining a table.'
  }

  if (message.includes('game_in_progress')) {
    return 'This game is already in progress, so you cannot leave from the lobby flow.'
  }

  if (message.includes('not_seated')) {
    return 'You are no longer seated at that table.'
  }

  if (message.includes('table_unavailable')) {
    return 'That table is not available for seating right now.'
  }

  if (message.includes('not_enough_players')) {
    return 'The table needs all four seats filled before starting.'
  }

  if (message.includes('not_all_ready')) {
    return 'All seated players must be ready before starting.'
  }

  if (message.includes('game_already_started')) {
    return 'This table already has a game in progress.'
  }

  if (message.includes('game_not_found')) {
    return 'That game could not be found.'
  }

  if (message.includes('hand_not_found')) {
    return 'Your secure hand is not available for this game yet.'
  }

  if (message.includes('game_not_active')) {
    return 'This round is not active right now.'
  }

  if (message.includes('not_your_turn')) {
    return 'It is not your turn yet.'
  }

  if (message.includes('tile_not_owned')) {
    return 'That tile is not in your hand.'
  }

  if (message.includes('illegal_move')) {
    return 'That tile does not match the selected open end.'
  }

  if (
    message.includes('first_tile_must_start') ||
    message.includes('start_side_unavailable') ||
    message.includes('invalid_side')
  ) {
    return 'Choose a valid side for this board state.'
  }

  if (message.includes('legal_move_available')) {
    return 'You have a legal tile to play, so you cannot pass.'
  }

  if (message.includes('invalid_seat')) {
    return 'Choose one of the available table seats.'
  }

  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Network trouble reached the table. Check your connection and try again.'
  }

  if (message.includes('supabase is not configured')) {
    return 'Supabase is not configured yet. Add your local environment values first.'
  }

  return 'Something went wrong. Please try again.'
}
