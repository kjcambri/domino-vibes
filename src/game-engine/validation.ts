import {
  type BoardSide,
  type BoardState,
  type DominoTile,
  type LegalMove,
  type PlayedAs,
} from './types'

export function getLegalMoves(
  hand: DominoTile[],
  board: BoardState,
): LegalMove[] {
  if (board.placements.length === 0) {
    return hand.map((tile) => ({
      tileId: tile.id,
      side: 'start',
      playedAs: 'normal',
    }))
  }

  const moves: LegalMove[] = []

  for (const tile of hand) {
    addMoveIfLegal(moves, tile, 'left', board)
    addMoveIfLegal(moves, tile, 'right', board)
  }

  return moves
}

export function canPlayerPlay(hand: DominoTile[], board: BoardState): boolean {
  return getLegalMoves(hand, board).length > 0
}

export function isLegalMove(
  tile: DominoTile,
  board: BoardState,
  side: BoardSide,
): boolean {
  return getLegalMoves([tile], board).some((move) => move.side === side)
}

function addMoveIfLegal(
  moves: LegalMove[],
  tile: DominoTile,
  side: Exclude<BoardSide, 'start'>,
  board: BoardState,
) {
  const openEnd = side === 'left' ? board.openEnds.left : board.openEnds.right

  if (openEnd === null) {
    return
  }

  if (tile.left === openEnd || tile.right === openEnd) {
    moves.push({
      tileId: tile.id,
      side,
      playedAs: getPlayedAs(tile, openEnd, side),
    })
  }
}

function getPlayedAs(
  tile: DominoTile,
  openEnd: number,
  side: Exclude<BoardSide, 'start'>,
): PlayedAs {
  if (tile.isDouble) {
    return 'normal'
  }

  if (side === 'left') {
    return tile.right === openEnd ? 'normal' : 'flipped'
  }

  return tile.left === openEnd ? 'normal' : 'flipped'
}
