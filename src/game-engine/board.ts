import {
  type BoardPlacement,
  type BoardSide,
  type BoardState,
  type DominoPip,
  type DominoTile,
  type PlayerId,
} from './types'

export function createEmptyBoard(): BoardState {
  return {
    placements: [],
    openEnds: {
      left: null,
      right: null,
    },
  }
}

export function getOpenEnds(board: BoardState): BoardState['openEnds'] {
  return { ...board.openEnds }
}

export function placeTileOnBoard(
  board: BoardState,
  tile: DominoTile,
  side: BoardSide,
  playerId: PlayerId,
  turnNumber: number,
): BoardState {
  if (board.placements.length === 0) {
    if (side !== 'start') {
      throw new Error('First tile must be played on start')
    }

    return {
      placements: [
        {
          tile,
          playedBy: playerId,
          side,
          leftValue: tile.left,
          rightValue: tile.right,
          turnNumber,
        },
      ],
      openEnds: {
        left: tile.left,
        right: tile.right,
      },
    }
  }

  if (side === 'start') {
    throw new Error('Start side is only valid for an empty board')
  }

  if (side === 'left') {
    return placeOnLeft(board, tile, playerId, turnNumber)
  }

  return placeOnRight(board, tile, playerId, turnNumber)
}

function placeOnLeft(
  board: BoardState,
  tile: DominoTile,
  playerId: PlayerId,
  turnNumber: number,
): BoardState {
  const openLeft = board.openEnds.left

  if (openLeft === null) {
    throw new Error('Board has no left open end')
  }

  if (tile.right === openLeft) {
    return prependPlacement(board, tile, playerId, turnNumber, tile.left, tile.right)
  }

  if (tile.left === openLeft) {
    return prependPlacement(board, tile, playerId, turnNumber, tile.right, tile.left)
  }

  throw new Error('Tile does not match left open end')
}

function placeOnRight(
  board: BoardState,
  tile: DominoTile,
  playerId: PlayerId,
  turnNumber: number,
): BoardState {
  const openRight = board.openEnds.right

  if (openRight === null) {
    throw new Error('Board has no right open end')
  }

  if (tile.left === openRight) {
    return appendPlacement(board, tile, playerId, turnNumber, tile.left, tile.right)
  }

  if (tile.right === openRight) {
    return appendPlacement(board, tile, playerId, turnNumber, tile.right, tile.left)
  }

  throw new Error('Tile does not match right open end')
}

function prependPlacement(
  board: BoardState,
  tile: DominoTile,
  playerId: PlayerId,
  turnNumber: number,
  leftValue: DominoPip,
  rightValue: DominoPip,
): BoardState {
  const placement: BoardPlacement = {
    tile,
    playedBy: playerId,
    side: 'left',
    leftValue,
    rightValue,
    turnNumber,
  }

  return {
    placements: [placement, ...board.placements],
    openEnds: {
      left: leftValue,
      right: board.openEnds.right,
    },
  }
}

function appendPlacement(
  board: BoardState,
  tile: DominoTile,
  playerId: PlayerId,
  turnNumber: number,
  leftValue: DominoPip,
  rightValue: DominoPip,
): BoardState {
  const placement: BoardPlacement = {
    tile,
    playedBy: playerId,
    side: 'right',
    leftValue,
    rightValue,
    turnNumber,
  }

  return {
    placements: [...board.placements, placement],
    openEnds: {
      left: board.openEnds.left,
      right: rightValue,
    },
  }
}
