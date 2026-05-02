import { type DominoPip, type DominoTile } from './types'

const validPips = [0, 1, 2, 3, 4, 5, 6] as const

export function isDominoPip(value: number): value is DominoPip {
  return validPips.includes(value as DominoPip)
}

export function createTile(left: number, right: number): DominoTile {
  if (!isDominoPip(left) || !isDominoPip(right)) {
    throw new Error('Domino pips must be between 0 and 6')
  }

  const low = Math.min(left, right) as DominoPip
  const high = Math.max(left, right) as DominoPip

  return {
    id: `${low}-${high}`,
    left: low,
    right: high,
    isDouble: low === high,
    pipTotal: low + high,
  }
}

// Tile ids use low-high format, so 4-6 exists and 6-4 does not.
export function createDoubleSixSet(): DominoTile[] {
  const tiles: DominoTile[] = []

  for (const left of validPips) {
    for (const right of validPips) {
      if (left <= right) {
        tiles.push(createTile(left, right))
      }
    }
  }

  return tiles
}
