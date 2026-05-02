export type DominoPip = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type DominoTile = {
  id: string
  left: DominoPip
  right: DominoPip
  isDouble: boolean
  pipTotal: number
}

export type PlayerId = string

export type SeatNumber = 1 | 2 | 3 | 4

export type GameMode = 'cutthroat_4'

export type BoardSide = 'left' | 'right' | 'start'

export type PlayedAs = 'normal' | 'flipped'

export type BoardPlacement = {
  tile: DominoTile
  playedBy: PlayerId
  side: BoardSide
  leftValue: DominoPip
  rightValue: DominoPip
  turnNumber: number
}

export type BoardState = {
  placements: BoardPlacement[]
  openEnds: {
    left: DominoPip | null
    right: DominoPip | null
  }
}

export type PlayerEngineState = {
  playerId: PlayerId
  seatNumber: SeatNumber
  turnOrder: number
  hand: DominoTile[]
  hasPassed: boolean
}

export type RoundStatus = 'active' | 'round_finished'

export type RoundEndedReason = 'player_went_out' | 'blocked' | null

export type RoundState = {
  gameMode: GameMode
  players: PlayerEngineState[]
  board: BoardState
  currentTurnPlayerId: PlayerId
  turnNumber: number
  consecutivePasses: number
  status: RoundStatus
  roundWinnerPlayerId: PlayerId | null
  endedReason: RoundEndedReason
}

export type LegalMove = {
  tileId: string
  side: BoardSide
  playedAs: PlayedAs
}

export type MoveResult = {
  success: boolean
  state: RoundState
  error: string | null
}

export type DealResult = {
  hands: Record<PlayerId, DominoTile[]>
  boneyard: DominoTile[]
}

export type RoundScores = Record<PlayerId, number>
