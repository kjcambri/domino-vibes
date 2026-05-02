import { type GameMode } from '../lobby/types'

export type DominoTileDto = {
  id: string
  left: number
  right: number
  isDouble: boolean
  pipTotal: number
}

export type BoardSide = 'start' | 'left' | 'right'

export type BoardPlacementDto = {
  tile: DominoTileDto
  playedBy: string
  side: BoardSide
  leftValue: number
  rightValue: number
  turnNumber: number
}

export type BoardStateDto = {
  placements: BoardPlacementDto[]
  openEnds: {
    left: number | null
    right: number | null
  }
  roundWinnerPlayerId?: string | null
  endedReason?: 'player_went_out' | 'blocked' | null
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
  moveCount: number
  lastMove: GameMove | null
  roundWinnerPlayerId: string | null
  endedReason: 'player_went_out' | 'blocked' | null
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

export type GameMove = {
  id: string
  gameId: string
  playerId: string
  roundNumber: number
  moveNumber: number
  moveType: 'play' | 'pass'
  tile: DominoTileDto | null
  side: BoardSide | null
  createdAt: string
}
