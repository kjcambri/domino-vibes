import { describe, expect, it } from 'vitest'
import {
  canJoinFriend,
  canSpectateFriend,
  friendsKeys,
  getFriendlyFriendsError,
  getSearchResultAction,
  normalizeFriendSearch,
  type FriendHubFriend,
  type FriendSearchResult,
} from '../friendsUtils'

const baseFriend: FriendHubFriend = {
  avatarUrl: null,
  displayName: 'Table Captain',
  friendId: 'friend-1',
  friendshipId: 'friendship-1',
  joinedAt: '2026-05-10T12:00:00Z',
  lastSeenAt: null,
  levelLabel: 'Beta member',
  presenceStatus: 'offline',
  statusLabel: 'Offline',
  username: 'captain',
}

describe('friendsUtils', () => {
  it('normalizes friend search input for stable querying', () => {
    expect(normalizeFriendSearch('  Captain\u0000   Table  ')).toBe(
      'captain table',
    )
  })

  it('uses stable query keys for friends hub, search, and spectator pages', () => {
    expect(friendsKeys.hub()).toEqual(['friends', 'hub'])
    expect(friendsKeys.search('  Captain  ')).toEqual([
      'friends',
      'search',
      'captain',
    ])
    expect(friendsKeys.spectatorGame('game-1')).toEqual([
      'friends',
      'spectator-game',
      'game-1',
    ])
  })

  it('derives join and spectate availability from safe server ids', () => {
    expect(canJoinFriend({ ...baseFriend, joinTableId: 'table-1' })).toBe(true)
    expect(canJoinFriend({ ...baseFriend, spectateGameId: 'game-1' })).toBe(false)
    expect(canSpectateFriend({ ...baseFriend, spectateGameId: 'game-1' })).toBe(
      true,
    )
  })

  it('maps search result relationship status to the intended action', () => {
    const candidate: FriendSearchResult = {
      avatarUrl: null,
      displayName: 'Domino Friend',
      friendshipId: null,
      profileId: 'profile-1',
      relationshipDirection: 'none',
      relationshipStatus: 'none',
      username: 'domino_friend',
    }

    expect(getSearchResultAction(candidate)).toBe('send')
    expect(
      getSearchResultAction({
        ...candidate,
        friendshipId: 'friendship-1',
        relationshipDirection: 'incoming',
        relationshipStatus: 'pending',
      }),
    ).toBe('accept')
    expect(
      getSearchResultAction({
        ...candidate,
        friendshipId: 'friendship-1',
        relationshipDirection: 'outgoing',
        relationshipStatus: 'pending',
      }),
    ).toBe('pending')
    expect(
      getSearchResultAction({
        ...candidate,
        friendshipId: 'friendship-1',
        relationshipDirection: 'friend',
        relationshipStatus: 'accepted',
      }),
    ).toBe('friends')
  })

  it('maps friend backend failures to product-safe copy', () => {
    expect(getFriendlyFriendsError(new Error('friend_request_pending'))).toBe(
      'That friend request is already pending.',
    )
    expect(getFriendlyFriendsError(new Error('already_friends'))).toBe(
      'You are already friends.',
    )
    expect(getFriendlyFriendsError(new Error('spectator_access_denied'))).toBe(
      'You can only spectate active games with accepted friends.',
    )
  })
})
