import { describe, expect, it } from 'vitest'
import { createEmptyBoard, getOpenEnds, placeTileOnBoard } from '../board'
import { createTile } from '../tiles'

describe('board placement', () => {
  it('accepts a start move on an empty board', () => {
    const board = placeTileOnBoard(
      createEmptyBoard(),
      createTile(2, 5),
      'start',
      'p1',
      1,
    )

    expect(board.placements).toHaveLength(1)
    expect(board.openEnds).toEqual({ left: 2, right: 5 })
  })

  it('first placement sets open ends correctly', () => {
    const board = placeTileOnBoard(
      createEmptyBoard(),
      createTile(6, 6),
      'start',
      'p1',
      1,
    )

    expect(getOpenEnds(board)).toEqual({ left: 6, right: 6 })
  })

  it('left placement updates left open end', () => {
    const started = placeTileOnBoard(
      createEmptyBoard(),
      createTile(2, 5),
      'start',
      'p1',
      1,
    )
    const board = placeTileOnBoard(started, createTile(1, 2), 'left', 'p2', 2)

    expect(board.openEnds).toEqual({ left: 1, right: 5 })
    expect(started.openEnds).toEqual({ left: 2, right: 5 })
  })

  it('right placement updates right open end', () => {
    const started = placeTileOnBoard(
      createEmptyBoard(),
      createTile(2, 5),
      'start',
      'p1',
      1,
    )
    const board = placeTileOnBoard(started, createTile(5, 6), 'right', 'p2', 2)

    expect(board.openEnds).toEqual({ left: 2, right: 6 })
  })

  it('rejects invalid placement', () => {
    const started = placeTileOnBoard(
      createEmptyBoard(),
      createTile(2, 5),
      'start',
      'p1',
      1,
    )

    expect(() =>
      placeTileOnBoard(started, createTile(3, 4), 'left', 'p2', 2),
    ).toThrow('Tile does not match left open end')
  })
})
