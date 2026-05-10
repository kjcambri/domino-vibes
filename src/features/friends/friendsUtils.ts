import {
  type FriendHubFriend,
  type FriendRelationshipDirection,
  type FriendRelationshipStatus,
  type FriendSearchAction,
  type FriendSearchResult,
} from './types'

export type {
  FriendHubFriend,
  FriendRequest,
  FriendsHub,
  FriendSearchAction,
  FriendSearchResult,
} from './types'

export const friendsKeys = {
  hub: () => ['friends', 'hub'] as const,
  search: (query: string) => ['friends', 'search', normalizeFriendSearch(query)] as const,
  spectatorGame: (gameId?: string) => ['friends', 'spectator-game', gameId] as const,
}

export function normalizeFriendSearch(query: string) {
  return query.replaceAll('\u0000', '').replace(/\s+/g, ' ').trim().toLowerCase()
}

export function canJoinFriend(friend: FriendHubFriend) {
  return Boolean(friend.joinTableId)
}

export function canSpectateFriend(friend: FriendHubFriend) {
  return Boolean(friend.spectateGameId)
}

export function getSearchResultAction(
  result: Pick<
    FriendSearchResult,
    'relationshipDirection' | 'relationshipStatus' | 'friendshipId'
  >,
): FriendSearchAction {
  if (
    result.relationshipStatus === 'accepted' &&
    result.relationshipDirection === 'friend'
  ) {
    return 'friends'
  }

  if (
    result.relationshipStatus === 'pending' &&
    result.relationshipDirection === 'incoming' &&
    result.friendshipId
  ) {
    return 'accept'
  }

  if (
    result.relationshipStatus === 'pending' &&
    result.relationshipDirection === 'outgoing'
  ) {
    return 'pending'
  }

  return 'send'
}

export function getFriendlyFriendsError(error: unknown) {
  const message = getErrorText(error).toLowerCase()

  if (message.includes('not_authenticated') || message.includes('jwt')) {
    return 'Log in to manage friends.'
  }

  if (message.includes('profile_required')) {
    return 'Finish your player profile before adding friends.'
  }

  if (message.includes('cannot_friend_self')) {
    return 'You cannot add yourself as a friend.'
  }

  if (message.includes('friend_profile_not_found')) {
    return 'That player profile could not be found.'
  }

  if (message.includes('friend_request_pending')) {
    return 'That friend request is already pending.'
  }

  if (message.includes('already_friends')) {
    return 'You are already friends.'
  }

  if (
    message.includes('only_addressee_can_respond') ||
    message.includes('friend_request_access_denied')
  ) {
    return 'Only the invited player can respond to that request.'
  }

  if (message.includes('only_requester_can_cancel')) {
    return 'Only the sender can cancel that request.'
  }

  if (message.includes('friendship_not_found')) {
    return 'That friendship is no longer available.'
  }

  if (message.includes('friendship_access_denied')) {
    return 'You can only update your own friendships.'
  }

  if (message.includes('friendship_not_accepted')) {
    return 'That friendship is not active right now.'
  }

  if (message.includes('spectator_access_denied')) {
    return 'You can only spectate active games with accepted friends.'
  }

  if (message.includes('game_not_found')) {
    return 'That active game could not be found.'
  }

  return 'Could not update friends right now. Try again.'
}

export function normalizeRelationshipStatus(
  status: unknown,
): FriendRelationshipStatus {
  if (
    status === 'pending' ||
    status === 'accepted' ||
    status === 'declined' ||
    status === 'removed'
  ) {
    return status
  }

  return 'none'
}

export function normalizeRelationshipDirection(
  direction: unknown,
): FriendRelationshipDirection {
  if (
    direction === 'incoming' ||
    direction === 'outgoing' ||
    direction === 'friend'
  ) {
    return direction
  }

  return 'none'
}

function getErrorText(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object') {
    const errorRecord = error as Record<string, unknown>

    return ['message', 'code', 'details', 'hint']
      .map((key) => errorRecord[key])
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
  }

  return String(error)
}
