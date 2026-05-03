const DOMINO_ASSET_BASE = '/assets/dominoes'
const TABLE_ASSET_BASE = '/assets/tables'
const FALLBACK_TILE_ID = '0-0'

// Expected asset orientation: domino-low-high.png visually shows low on top
// and high on bottom.
export function normalizeTileId(tileId: string): string {
  const match = tileId.trim().match(/^([0-6])-([0-6])$/)

  if (!match) {
    return FALLBACK_TILE_ID
  }

  const first = Number(match[1])
  const second = Number(match[2])
  const low = Math.min(first, second)
  const high = Math.max(first, second)

  return `${low}-${high}`
}

export function isValidDominoTileId(tileId: string): boolean {
  return /^([0-6])-([0-6])$/.test(tileId.trim())
}

export function getDominoImageSrc(tileId: string): string {
  if (!isValidDominoTileId(tileId)) {
    return getDominoBackSrc()
  }

  return `${DOMINO_ASSET_BASE}/domino-${normalizeTileId(tileId)}.png`
}

export function getDominoBackSrc(): string {
  return `${DOMINO_ASSET_BASE}/domino-back.png`
}

export function getTableImageSrc(): string {
  return `${TABLE_ASSET_BASE}/domino-table.png`
}
