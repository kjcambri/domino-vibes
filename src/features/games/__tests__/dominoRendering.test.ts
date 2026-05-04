import { describe, expect, it } from 'vitest'
import {
  getDominoAriaLabel,
  getPipPositions,
  parseDominoTileId,
} from '../dominoRendering'

describe('dominoRendering', () => {
  it('parses prefixed low-high domino tile ids', () => {
    expect(parseDominoTileId('domino-2-6')).toEqual({
      id: '2-6',
      left: 2,
      right: 6,
    })
  })

  it('parses existing backend tile ids without a prefix', () => {
    expect(parseDominoTileId('4-5')).toEqual({
      id: '4-5',
      left: 4,
      right: 5,
    })
  })

  it('rejects invalid tile ids', () => {
    expect(parseDominoTileId('domino-8-9')).toBeNull()
    expect(parseDominoTileId('not-a-domino')).toBeNull()
  })

  it('returns the expected pip positions for each domino half value', () => {
    expect(getPipPositions(0)).toEqual([])
    expect(getPipPositions(1)).toEqual(['center'])
    expect(getPipPositions(2)).toEqual(['top-left', 'bottom-right'])
    expect(getPipPositions(3)).toEqual(['top-left', 'center', 'bottom-right'])
    expect(getPipPositions(4)).toEqual([
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right',
    ])
    expect(getPipPositions(5)).toEqual([
      'top-left',
      'top-right',
      'center',
      'bottom-left',
      'bottom-right',
    ])
    expect(getPipPositions(6)).toEqual([
      'top-left',
      'middle-left',
      'bottom-left',
      'top-right',
      'middle-right',
      'bottom-right',
    ])
  })

  it('returns no pips for invalid half values', () => {
    expect(getPipPositions(-1)).toEqual([])
    expect(getPipPositions(7)).toEqual([])
  })

  it('creates accessible domino labels', () => {
    expect(getDominoAriaLabel({ left: 2, right: 6 })).toBe('Domino 2-6')
  })

  it('preserves the normalized asset convention', () => {
    const tile = parseDominoTileId('domino-2-6')

    expect(tile?.left).toBe(2)
    expect(tile?.right).toBe(6)
  })
})
