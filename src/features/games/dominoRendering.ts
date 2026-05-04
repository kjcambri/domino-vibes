export type PipPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export type ParsedDominoTile = {
  id: string
  left: number
  right: number
}

const TILE_ID_PATTERN = /^(?:domino-)?([0-6])-([0-6])$/

const PIP_POSITIONS: Record<number, PipPosition[]> = {
  0: [],
  1: ['center'],
  2: ['top-left', 'bottom-right'],
  3: ['top-left', 'center', 'bottom-right'],
  4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
  6: [
    'top-left',
    'middle-left',
    'bottom-left',
    'top-right',
    'middle-right',
    'bottom-right',
  ],
}

export function parseDominoTileId(tileId: string): ParsedDominoTile | null {
  const match = tileId.trim().match(TILE_ID_PATTERN)

  if (!match) {
    return null
  }

  const first = Number(match[1])
  const second = Number(match[2])
  const left = Math.min(first, second)
  const right = Math.max(first, second)

  return {
    id: `${left}-${right}`,
    left,
    right,
  }
}

export function getPipPositions(value: number): PipPosition[] {
  return PIP_POSITIONS[value] ?? []
}

export function getDominoAriaLabel({
  left,
  right,
}: {
  left: number
  right: number
}): string {
  return `Domino ${left}-${right}`
}
