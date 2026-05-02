import { describe, expect, it } from 'vitest'
import { createDoubleSixSet } from '../tiles'

describe('createDoubleSixSet', () => {
  it('creates 28 unique double-six tiles', () => {
    const tiles = createDoubleSixSet()

    expect(tiles).toHaveLength(28)
    expect(new Set(tiles.map((tile) => tile.id)).size).toBe(28)
    expect(tiles.some((tile) => tile.id === '0-0')).toBe(true)
    expect(tiles.some((tile) => tile.id === '6-6')).toBe(true)
  })

  it('uses valid pips and low-high ids', () => {
    const tiles = createDoubleSixSet()

    for (const tile of tiles) {
      expect(tile.left).toBeGreaterThanOrEqual(0)
      expect(tile.left).toBeLessThanOrEqual(6)
      expect(tile.right).toBeGreaterThanOrEqual(0)
      expect(tile.right).toBeLessThanOrEqual(6)
      expect(tile.left).toBeLessThanOrEqual(tile.right)
      expect(tile.id).toBe(`${tile.left}-${tile.right}`)
    }
  })

  it('marks doubles correctly', () => {
    const tiles = createDoubleSixSet()

    for (const tile of tiles) {
      expect(tile.isDouble).toBe(tile.left === tile.right)
      expect(tile.pipTotal).toBe(tile.left + tile.right)
    }
  })
})
