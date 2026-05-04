const DOMINO_ASSET_BASE = '/assets/dominoes'
const DOMINO_OPTIMIZED_ASSET_BASE = '/assets/dominoes-webp'
const TABLE_ASSET_BASE = '/assets/tables'
const FALLBACK_TILE_ID = '0-0'

// Expected asset orientation: domino-low-high.png visually shows low on top
// and high on bottom.
// In tile data, tile.left is the visual top pip and tile.right is the
// visual bottom pip for an unrotated asset.
type DominoAssetOptions = {
  preferOptimized?: boolean
}

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

export function getDominoAssetCandidates(tileId: string): {
  optimizedSrc: string
  pngSrc: string
} {
  const isValidTile = isValidDominoTileId(tileId)
  const assetName = isValidTile ? `domino-${normalizeTileId(tileId)}` : 'domino-back'

  return {
    optimizedSrc: `${DOMINO_OPTIMIZED_ASSET_BASE}/${assetName}.webp`,
    pngSrc: `${DOMINO_ASSET_BASE}/${assetName}.png`,
  }
}

export function getDominoImageSrc(
  tileId: string,
  options: DominoAssetOptions = {},
): string {
  const sources = getDominoAssetCandidates(tileId)

  return options.preferOptimized ? sources.optimizedSrc : sources.pngSrc
}

export function getDominoBackSrc(): string {
  return `${DOMINO_ASSET_BASE}/domino-back.png`
}

export function getTableImageSrc(): string {
  return `${TABLE_ASSET_BASE}/domino-table.png`
}
