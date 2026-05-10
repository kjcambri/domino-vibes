const DOMINO_ASSET_BASE = '/assets/dominoes'
const DOMINO_REAL_BOARD_ASSET_BASE = '/assets/dominoes-real-board-webp'
const DOMINO_REAL_ASSET_BASE = '/assets/dominoes-real-webp'
const DOMINO_OPTIMIZED_ASSET_BASE = '/assets/dominoes-webp'
const DOMINO_NORMALIZED_ASSET_BASE = '/assets/dominoes-normalized-webp'
const TABLE_ASSET_BASE = '/assets/tables'
const FALLBACK_TILE_ID = '0-0'
const TILE_ID_PATTERN = /^(?:domino-)?([0-6])-([0-6])$/

export const USE_PROCEDURAL_DOMINOES = false
export const USE_REAL_BOARD_DOMINO_ASSETS = true
export const USE_REAL_DOMINO_ASSETS = true
export const USE_NORMALIZED_DOMINO_ASSETS = false

// Expected asset orientation: domino-low-high.png visually shows low on top
// and high on bottom.
// In tile data, tile.left is the visual top pip and tile.right is the
// visual bottom pip for an unrotated asset.
type DominoAssetOptions = {
  preferBoard?: boolean
  preferOptimized?: boolean
  preferNormalized?: boolean
}

export function normalizeTileId(tileId: string): string {
  const match = tileId.trim().match(TILE_ID_PATTERN)

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
  return TILE_ID_PATTERN.test(tileId.trim())
}

export function getDominoAssetCandidates(tileId: string): {
  boardSrc: string
  realSrc: string
  normalizedSrc: string
  optimizedSrc: string
  pngSrc: string
} {
  const isValidTile = isValidDominoTileId(tileId)
  const assetName = isValidTile ? `domino-${normalizeTileId(tileId)}` : 'domino-back'

  return {
    boardSrc: `${DOMINO_REAL_BOARD_ASSET_BASE}/${assetName}.webp`,
    realSrc: `${DOMINO_REAL_ASSET_BASE}/${assetName}.webp`,
    normalizedSrc: `${DOMINO_NORMALIZED_ASSET_BASE}/${assetName}.webp`,
    optimizedSrc: `${DOMINO_OPTIMIZED_ASSET_BASE}/${assetName}.webp`,
    pngSrc: `${DOMINO_ASSET_BASE}/${assetName}.png`,
  }
}

export function getDominoImageFallbackSources(
  tileId: string,
  options: DominoAssetOptions = {},
): string[] {
  const sources = getDominoAssetCandidates(tileId)
  const orderedSources = [
    ...(options.preferBoard && USE_REAL_BOARD_DOMINO_ASSETS
      ? [sources.boardSrc]
      : []),
    ...(USE_REAL_DOMINO_ASSETS ? [sources.realSrc] : []),
    sources.optimizedSrc,
    ...(USE_NORMALIZED_DOMINO_ASSETS ? [sources.normalizedSrc] : []),
    sources.pngSrc,
  ]

  return Array.from(new Set(orderedSources))
}

export function getDominoImageSrc(
  tileId: string,
  options: DominoAssetOptions = {},
): string {
  const sources = getDominoAssetCandidates(tileId)

  if (options.preferBoard && USE_REAL_BOARD_DOMINO_ASSETS) {
    return sources.boardSrc
  }

  if (options.preferOptimized) {
    return options.preferNormalized || USE_NORMALIZED_DOMINO_ASSETS
      ? sources.normalizedSrc
      : sources.optimizedSrc
  }

  if (options.preferNormalized || USE_NORMALIZED_DOMINO_ASSETS) {
    return sources.normalizedSrc
  }

  return USE_REAL_DOMINO_ASSETS ? sources.realSrc : sources.pngSrc
}

export function getDominoBackSrc(): string {
  return getDominoImageSrc('domino-back')
}

export function getTableImageSrc(): string {
  return `${TABLE_ASSET_BASE}/domino-table.png`
}
