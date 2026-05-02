import { describe, expect, it } from 'vitest'
import { createEmptyBoard, placeTileOnBoard } from '../board'
import { createTile } from '../tiles'
import { canPlayerPlay, getLegalMoves } from '../validation'

describe('move validation', () => {
  it('returns start moves for an empty board', () => {
    const hand = [createTile(0, 1), createTile(3, 3)]

    expect(getLegalMoves(hand, createEmptyBoard())).toEqual([
      { tileId: '0-1', side: 'start', playedAs: 'normal' },
      { tileId: '3-3', side: 'start', playedAs: 'normal' },
    ])
  })

  it('detects matching left and right moves', () => {
    const board = placeTileOnBoard(
      createEmptyBoard(),
      createTile(2, 5),
      'start',
      'p1',
      1,
    )
    const moves = getLegalMoves(
      [createTile(1, 2), createTile(5, 6), createTile(5, 2)],
      board,
    )

    expect(moves).toContainEqual({
      tileId: '1-2',
      side: 'left',
      playedAs: 'normal',
    })
    expect(moves).toContainEqual({
      tileId: '5-6',
      side: 'right',
      playedAs: 'normal',
    })
    expect(moves).toContainEqual({
      tileId: '2-5',
      side: 'left',
      playedAs: 'flipped',
    })
    expect(moves).toContainEqual({
      tileId: '2-5',
      side: 'right',
      playedAs: 'flipped',
    })
  })

  it('returns empty list when no legal moves exist', () => {
    const board = placeTileOnBoard(
      createEmptyBoard(),
      createTile(2, 5),
      'start',
      'p1',
      1,
    )

    expect(getLegalMoves([createTile(0, 1), createTile(3, 4)], board)).toEqual([])
  })

  it('canPlayerPlay reflects legal move availability', () => {
    const board = placeTileOnBoard(
      createEmptyBoard(),
      createTile(2, 5),
      'start',
      'p1',
      1,
    )

    expect(canPlayerPlay([createTile(3, 4)], board)).toBe(false)
    expect(canPlayerPlay([createTile(4, 5)], board)).toBe(true)
  })
})
