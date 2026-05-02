import { describe, expect, it } from 'vitest'
import { canHandPlay, getLegalSides } from '../gameplayRules'
import { type BoardStateDto, type DominoTileDto } from '../types'

const tile = (id: string, left: number, right: number): DominoTileDto => ({
  id,
  left,
  right,
  isDouble: left === right,
  pipTotal: left + right,
})

const board = (
  left: number | null,
  right: number | null,
  placements = 1,
): BoardStateDto => ({
  placements: Array.from({ length: placements }, (_, index) => ({
    tile: tile(`${index}-${index}`, index, index),
    playedBy: 'player-a',
    side: index === 0 ? 'start' : 'right',
    leftValue: index,
    rightValue: index,
    turnNumber: index + 1,
  })),
  openEnds: { left, right },
})

describe('gameplayRules', () => {
  it('allows any tile on start when the board is empty', () => {
    expect(getLegalSides(tile('2-5', 2, 5), board(null, null, 0))).toEqual([
      'start',
    ])
  })

  it('detects left and right legal sides from open ends', () => {
    expect(getLegalSides(tile('2-6', 2, 6), board(2, 6))).toEqual([
      'left',
      'right',
    ])
  })

  it('detects when a hand cannot play', () => {
    expect(canHandPlay([tile('1-3', 1, 3)], board(4, 6))).toBe(false)
  })
})
