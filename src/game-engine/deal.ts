import { type DealResult, type DominoTile, type PlayerId } from './types'

export function dealTiles(
  tiles: DominoTile[],
  playerIds: PlayerId[],
): DealResult {
  if (playerIds.length !== 4) {
    throw new Error('Cutthroat requires exactly 4 players')
  }

  if (tiles.length !== 28) {
    throw new Error('Double-six cutthroat requires exactly 28 tiles')
  }

  const hands: Record<PlayerId, DominoTile[]> = {}
  for (const playerId of playerIds) {
    hands[playerId] = []
  }

  tiles.forEach((tile, index) => {
    const playerId = playerIds[index % 4]
    if (!playerId) {
      throw new Error('Missing player for deal')
    }

    hands[playerId] = [...(hands[playerId] ?? []), tile]
  })

  return {
    hands,
    boneyard: [],
  }
}
