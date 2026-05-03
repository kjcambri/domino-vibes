import { type GameMode } from '../lobby/types'

export type DominoTileDto = {
  id: string
  left: number
  right: number
  isDouble: boolean
  pipTotal: number
}

export type BoardSide = 'start' | 'left' | 'right'
export type BoardDirection = 'right' | 'left' | 'up' | 'down'
export type DominoOrientation = 'horizontal' | 'vertical'
export type RoundEndedReason = 'player_went_out' | 'blocked'
export type GameEndedReason =
  | 'player_reached_6'
  | 'all_players_scored'
  | 'cancelled'

export type BoardVisualEndpointDto = {
  x: number
  y: number
  direction: BoardDirection
  pip: number
  side?: 'left' | 'right'
  row: number
  runCount: number
  horizontalDirection?: 'left' | 'right'
  horizontalRunCount?: number
  verticalRunCount?: number
  lastTurnDirection?: 'left' | 'right'
}

export type BoardPlacementDto = {
  tile: DominoTileDto
  playedBy: string
  side: BoardSide
  leftValue: number
  rightValue: number
  turnNumber: number
  x?: number
  y?: number
  rotation?: number
  orientation?: DominoOrientation
  direction?: BoardDirection
  connectedPip?: number | null
  exposedPip?: number | null
  connectedTileSide?: 'left' | 'right' | null
  isDouble?: boolean
}

export type BoardStateDto = {
  placements: BoardPlacementDto[]
  openEnds: {
    left: number | null
    right: number | null
  }
  visual?: {
    leftEndpoint: BoardVisualEndpointDto | null
    rightEndpoint: BoardVisualEndpointDto | null
    bounds: {
      minX: number
      maxX: number
      minY: number
      maxY: number
    }
  }
  roundWinnerPlayerId?: string | null
  endedReason?: RoundEndedReason | null
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
  roundEndedReason: RoundEndedReason | null
  winnerPlayerId: string | null
  endedReason: GameEndedReason | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
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

export type StartNextRoundResult = {
  gameId: string
  roundNumber: number
  status: 'active'
  currentTurnPlayerId: string
}

export type LeaveFinishedGameResult = {
  gameId: string
  tableId: string
  tableReset: boolean
  remainingSeatedCount: number
}

export type GamePresenceHeartbeatResult = {
  gameId: string
  playerId: string
  lastSeenAt: string
}

export type MarkStalePlayersResult = {
  staleCount: number
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
