import {
  type BoardSide,
  type BoardStateDto,
  type DominoTileDto,
} from './types'

export function getLegalSides(
  tile: DominoTileDto,
  boardState: BoardStateDto,
): BoardSide[] {
  if (boardState.placements.length === 0) {
    return ['start']
  }

  const sides: BoardSide[] = []
  const { left, right } = boardState.openEnds

  if (left !== null && (tile.left === left || tile.right === left)) {
    sides.push('left')
  }

  if (right !== null && (tile.left === right || tile.right === right)) {
    sides.push('right')
  }

  return sides
}

export function canHandPlay(
  hand: DominoTileDto[],
  boardState: BoardStateDto,
): boolean {
  return hand.some((tile) => getLegalSides(tile, boardState).length > 0)
}
