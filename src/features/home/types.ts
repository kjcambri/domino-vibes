import { type GameMode } from '../lobby/types'
import { type BoardPlacementDto, type BoardStateDto } from '../games/types'

export type FeaturedLiveGameBoardState = {
  placements: BoardPlacementDto[]
  openEnds: BoardStateDto['openEnds']
  visual?: BoardStateDto['visual']
}

export type FeaturedLiveGamePreviewPlayer = {
  displayName: string
  seatNumber: number
  score: number
  handCount: number
  isCurrentTurn: boolean
}

export type FeaturedLiveGamePreview = {
  gameId: string
  tableId: string
  tableName: string
  gameMode: GameMode
  status: 'active'
  currentRoundNumber: number
  pointsToWin: number
  moveCount: number
  dominoesInPlay: number
  boardState: FeaturedLiveGameBoardState
  players: FeaturedLiveGamePreviewPlayer[]
}
