import { supabase } from '../../lib/supabaseClient'
import {
  normalizeRelationshipDirection,
  normalizeRelationshipStatus,
} from './friendsUtils'
import { mapSpectatorGameRoomPayload } from './spectatorUtils'
import {
  type FriendRequest,
  type FriendSearchResult,
  type FriendSearchResultRow,
  type FriendshipRow,
  type FriendsHub,
  type SpectatorGameRoom,
  type UserPresenceHeartbeatResult,
  type UserPresenceHeartbeatRow,
} from './types'

type FriendsHubPayload = Partial<FriendsHub>

function toFriendSearchResult(row: FriendSearchResultRow): FriendSearchResult {
  return {
    profileId: row.profile_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    friendshipId: row.friendship_id,
    relationshipStatus: normalizeRelationshipStatus(row.relationship_status),
    relationshipDirection: normalizeRelationshipDirection(
      row.relationship_direction,
    ),
  }
}

function toFriendship(row: FriendshipRow) {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    respondedAt: row.responded_at,
  }
}

export async function getFriendsHub(): Promise<FriendsHub> {
  const { data, error } = await supabase.rpc('get_friends_hub')

  if (error) {
    throw error
  }

  const payload = (data ?? {}) as FriendsHubPayload

  return {
    friends: Array.isArray(payload.friends) ? payload.friends : [],
    incomingRequests: normalizeRequests(payload.incomingRequests, 'incoming'),
    outgoingRequests: normalizeRequests(payload.outgoingRequests, 'outgoing'),
  }
}

export async function searchFriendCandidates(query: string) {
  const { data, error } = await supabase.rpc('search_friend_candidates', {
    p_query: query,
    p_limit: 8,
  })

  if (error) {
    throw error
  }

  return ((data ?? []) as FriendSearchResultRow[]).map(toFriendSearchResult)
}

export async function sendFriendRequest(addresseeId: string) {
  const { data, error } = await supabase.rpc('send_friend_request', {
    p_addressee_id: addresseeId,
  })

  if (error) {
    throw error
  }

  return toFriendship(((data ?? []) as FriendshipRow[])[0])
}

export async function respondFriendRequest({
  friendshipId,
  accept,
}: {
  friendshipId: string
  accept: boolean
}) {
  const { data, error } = await supabase.rpc('respond_friend_request', {
    p_friendship_id: friendshipId,
    p_accept: accept,
  })

  if (error) {
    throw error
  }

  return toFriendship(((data ?? []) as FriendshipRow[])[0])
}

export async function cancelFriendRequest(friendshipId: string) {
  const { error } = await supabase.rpc('cancel_friend_request', {
    p_friendship_id: friendshipId,
  })

  if (error) {
    throw error
  }
}

export async function removeFriend(friendshipId: string) {
  const { error } = await supabase.rpc('remove_friend', {
    p_friendship_id: friendshipId,
  })

  if (error) {
    throw error
  }
}

export async function heartbeatUserPresence(): Promise<UserPresenceHeartbeatResult> {
  const { data, error } = await supabase.rpc('heartbeat_user_presence')

  if (error) {
    throw error
  }

  const result = ((data ?? []) as UserPresenceHeartbeatRow[])[0]

  if (!result) {
    throw new Error('presence_update_failed')
  }

  return {
    userId: result.user_id,
    lastSeenAt: result.last_seen_at,
  }
}

export async function getSpectatorGameRoom(
  gameId: string,
): Promise<SpectatorGameRoom> {
  const { data, error } = await supabase.rpc('get_spectator_game_room', {
    p_game_id: gameId,
  })

  if (error) {
    throw error
  }

  const mapped = mapSpectatorGameRoomPayload(data)

  if (!mapped) {
    throw new Error('spectator_payload_malformed')
  }

  return mapped
}

function normalizeRequests(
  requests: unknown,
  direction: FriendRequest['direction'],
): FriendRequest[] {
  if (!Array.isArray(requests)) {
    return []
  }

  return requests.map((request) => ({
    ...(request as FriendRequest),
    direction,
  }))
}
