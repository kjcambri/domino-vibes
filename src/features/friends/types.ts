import {
  type BoardStateDto,
  type GameRoomPlayer,
  type GameStatus,
} from '../games/types'
import { type GameMode } from '../lobby/types'

export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'removed'
export type FriendRelationshipStatus = FriendshipStatus | 'none'
export type FriendRelationshipDirection =
  | 'none'
  | 'incoming'
  | 'outgoing'
  | 'friend'

export type FriendPresenceStatus = 'online' | 'away' | 'offline'

export type FriendSearchAction = 'send' | 'accept' | 'pending' | 'friends'

export type FriendSearchResult = {
  profileId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  friendshipId: string | null
  relationshipStatus: FriendRelationshipStatus
  relationshipDirection: FriendRelationshipDirection
}

export type FriendHubFriend = {
  friendshipId: string
  friendId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  levelLabel: string
  presenceStatus: FriendPresenceStatus
  statusLabel: string
  lastSeenAt: string | null
  tableId?: string | null
  tableName?: string | null
  tableStatus?: string | null
  gameId?: string | null
  gameStatus?: GameStatus | null
  joinTableId?: string | null
  spectateGameId?: string | null
  joinedAt: string
}

export type FriendRequest = {
  friendshipId: string
  profileId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  requestedAt: string
  direction: 'incoming' | 'outgoing'
}

export type FriendsHub = {
  friends: FriendHubFriend[]
  incomingRequests: FriendRequest[]
  outgoingRequests: FriendRequest[]
}

export type UserPresenceHeartbeatResult = {
  userId: string
  lastSeenAt: string
}

export type SpectatorGameInfo = {
  id: string
  tableId: string
  tableName: string
  gameMode: GameMode
  status: GameStatus
  currentRoundNumber: number
  currentTurnPlayerId: string | null
  boardState: BoardStateDto
  moveCount: number
}

export type SpectatorGameRoom = {
  game: SpectatorGameInfo
  players: GameRoomPlayer[]
}

export type FriendSearchResultRow = {
  profile_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  friendship_id: string | null
  relationship_status: FriendRelationshipStatus
  relationship_direction: FriendRelationshipDirection
}

export type FriendshipRow = {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  updated_at: string
  responded_at?: string | null
}

export type UserPresenceHeartbeatRow = {
  user_id: string
  last_seen_at: string
}
