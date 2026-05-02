import { type GameMode } from '../lobby/types'

export type DominoTileDto = {
  id: string
  left: number
  right: number
  isDouble: boolean
  pipTotal: number
}

export type BoardStateDto = {
  placements: unknown[]
  openEnds: {
    left: number | null
    right: number | null
  }
}

export type GameStatus =
  | 'setup'
  | 'active'
  | 'round_finished'
  | 'finished'
  | 'cancelled'

export type GameRoomPlayer = {
  playerId: string | null
  seatNumber: number
  turnOrder: number
  score: number
  roundScore: number
  hasPassed: boolean
  isConnected: boolean
  lastSeenAt: string
  handCount: number
  username: string | null
  displayName: string | null
  avatarUrl: string | null
}

export type GameRoomInfo = {
  id: string
  tableId: string
  tableName: string
  gameMode: GameMode
  status: GameStatus
  currentRoundNumber: number
  currentTurnPlayerId: string | null
  boardState: BoardStateDto
  createdAt: string
  startedAt: string | null
}

export type GameRoom = {
  game: GameRoomInfo
  players: GameRoomPlayer[]
  currentUser: {
    playerId: string
    seatNumber: number
    turnOrder: number
  } | null
}

export type MyHand = {
  gameId: string
  playerId: string
  tiles: DominoTileDto[]
}
