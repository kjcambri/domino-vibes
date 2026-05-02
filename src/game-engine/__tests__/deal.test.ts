import { describe, expect, it } from 'vitest'
import { dealTiles } from '../deal'
import { createDoubleSixSet } from '../tiles'

const playerIds = ['a', 'b', 'c', 'd']

describe('dealTiles', () => {
  it('deals 7 tiles to each of 4 players', () => {
    const result = dealTiles(createDoubleSixSet(), playerIds)

    expect(Object.keys(result.hands)).toEqual(playerIds)
    for (const hand of Object.values(result.hands)) {
      expect(hand).toHaveLength(7)
    }
    expect(result.boneyard).toHaveLength(0)
  })

  it('throws for invalid player count', () => {
    expect(() => dealTiles(createDoubleSixSet(), ['a', 'b', 'c'])).toThrow(
      'Cutthroat requires exactly 4 players',
    )
  })

  it('does not mutate tile input', () => {
    const tiles = createDoubleSixSet()
    const originalIds = tiles.map((tile) => tile.id)

    dealTiles(tiles, playerIds)

    expect(tiles.map((tile) => tile.id)).toEqual(originalIds)
  })
})
