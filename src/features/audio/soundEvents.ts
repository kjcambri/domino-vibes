import { type ChatMessage } from '../chat/types'
import { type GameRoomInfo } from '../games/types'
import { type TableRoom } from '../tables/types'

export type SoundCue =
  | 'tile-select'
  | 'tile-start'
  | 'tile-place'
  | 'pass-turn'
  | 'your-turn'
  | 'round-won'
  | 'game-over'
  | 'round-start'
  | 'seat-join'
  | 'ready-up'
  | 'game-start'
  | 'chat-message'

export function getGameSoundEvents(
  previous: GameRoomInfo | null,
  current: GameRoomInfo,
  currentUserPlayerId?: string | null,
): SoundCue[] {
  if (!previous) {
    return []
  }

  const cues: SoundCue[] = []
  const moveAdvanced =
    current.moveCount > previous.moveCount &&
    current.lastMove?.id !== previous.lastMove?.id
  const placementCount = current.boardState.placements.length
  const previousPlacementCount = previous.boardState.placements.length

  if (moveAdvanced && current.lastMove?.moveType === 'play') {
    cues.push(previousPlacementCount === 0 && placementCount > 0 ? 'tile-start' : 'tile-place')
  }

  if (moveAdvanced && current.lastMove?.moveType === 'pass') {
    cues.push('pass-turn')
  }

  if (
    previous.status === 'round_finished' &&
    current.status === 'active' &&
    current.currentRoundNumber > previous.currentRoundNumber
  ) {
    cues.push('round-start')
  }

  if (previous.status !== 'finished' && current.status === 'finished') {
    cues.push('game-over')
  } else if (
    previous.status !== 'round_finished' &&
    current.status === 'round_finished'
  ) {
    cues.push('round-won')
  }

  if (
    current.status === 'active' &&
    currentUserPlayerId &&
    previous.currentTurnPlayerId !== current.currentTurnPlayerId &&
    current.currentTurnPlayerId === currentUserPlayerId
  ) {
    cues.push('your-turn')
  }

  return cues
}

export function getTableSoundEvents(
  previous: TableRoom | null,
  current: TableRoom,
): SoundCue[] {
  if (!previous) {
    return []
  }

  const cues: SoundCue[] = []
  const previousSeatedCount = previous.seats.filter((seat) => seat.playerId).length
  const seatedCount = current.seats.filter((seat) => seat.playerId).length
  const previousReadyCount = previous.seats.filter(
    (seat) => seat.playerId && seat.isReady,
  ).length
  const readyCount = current.seats.filter(
    (seat) => seat.playerId && seat.isReady,
  ).length

  if (seatedCount > previousSeatedCount) {
    cues.push('seat-join')
  }

  if (readyCount > previousReadyCount) {
    cues.push('ready-up')
  }

  if (previous.table.status !== 'in_game' && current.table.status === 'in_game') {
    cues.push('game-start')
  }

  return cues
}

export function getChatSoundEvents(
  previous: ChatMessage[] | null,
  current: ChatMessage[],
  currentUserId?: string | null,
): SoundCue[] {
  if (!previous) {
    return []
  }

  const previousMessageIds = new Set(previous.map((message) => message.id))
  const hasNewIncomingMessage = current.some(
    (message) =>
      !previousMessageIds.has(message.id) &&
      !message.isSystem &&
      message.senderId !== currentUserId,
  )

  return hasNewIncomingMessage ? ['chat-message'] : []
}
