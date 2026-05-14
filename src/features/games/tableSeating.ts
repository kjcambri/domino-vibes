import { type GameRoomPlayer } from './types'

export type TableSeatPosition = 'bottom' | 'left' | 'top' | 'right'

export type RelativeTableSeats = Record<TableSeatPosition, GameRoomPlayer | null>

const seatPositionsByOffset: TableSeatPosition[] = [
  'bottom',
  'left',
  'top',
  'right',
]

function getSeatOffset(seatNumber: number, anchorSeatNumber: number) {
  return ((seatNumber - anchorSeatNumber) % 4 + 4) % 4
}

export function getRelativeTableSeats(
  players: GameRoomPlayer[],
  currentUserPlayerId?: string | null,
): RelativeTableSeats {
  const sortedPlayers = [...players].sort((first, second) => {
    if (first.seatNumber !== second.seatNumber) {
      return first.seatNumber - second.seatNumber
    }

    return first.turnOrder - second.turnOrder
  })
  const currentPlayer =
    sortedPlayers.find((player) => player.playerId === currentUserPlayerId) ??
    sortedPlayers[0] ??
    null
  const seats: RelativeTableSeats = {
    bottom: null,
    left: null,
    top: null,
    right: null,
  }

  if (!currentPlayer) {
    return seats
  }

  sortedPlayers.forEach((player) => {
    const offset = getSeatOffset(player.seatNumber, currentPlayer.seatNumber)
    const position = seatPositionsByOffset[offset]

    if (position) {
      seats[position] = player
    }
  })

  return seats
}

export function getHiddenRackSlots(handCount: number) {
  const safeCount = Math.max(0, Math.floor(handCount))

  return Array.from({ length: safeCount }, (_unused, index) => ({
    slotId: `hidden-domino-${index + 1}`,
  }))
}
