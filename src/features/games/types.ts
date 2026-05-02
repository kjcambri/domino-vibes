import { type GameMode } from '../lobby/types'

export type GameStatus =
  | 'setup'
  | 'active'
  | 'round_finished'
  | 'finished'
  | 'cancelled'

export type GameRoomPlayer = {
  seatNumber: number
  playerId: string | null
  isReady: boolean
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
  boardState: Record<string, unknown>
  createdAt: string
  startedAt: string | null
}

export type GameRoom = {
  game: GameRoomInfo
  players: GameRoomPlayer[]
}
