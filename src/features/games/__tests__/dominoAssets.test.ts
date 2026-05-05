import { describe, expect, it } from 'vitest'
import {
  getDominoAssetCandidates,
  getDominoBackSrc,
  getDominoImageFallbackSources,
  getDominoImageSrc,
  getTableImageSrc,
  isValidDominoTileId,
  normalizeTileId,
  USE_NORMALIZED_DOMINO_ASSETS,
  USE_PROCEDURAL_DOMINOES,
  USE_REAL_DOMINO_ASSETS,
} from '../dominoAssets'

describe('dominoAssets', () => {
  it('uses real image assets as the default tile renderer', () => {
    expect(USE_REAL_DOMINO_ASSETS).toBe(true)
    expect(USE_PROCEDURAL_DOMINOES).toBe(false)
    expect(USE_NORMALIZED_DOMINO_ASSETS).toBe(false)
  })

  it('keeps low-high tile ids unchanged', () => {
    expect(normalizeTileId('0-0')).toBe('0-0')
    expect(normalizeTileId('4-6')).toBe('4-6')
  })

  it('normalizes reversed tile ids to backend low-high format', () => {
    expect(normalizeTileId('6-4')).toBe('4-6')
    expect(normalizeTileId('domino-6-4')).toBe('4-6')
  })

  it('validates only double-six tile ids', () => {
    expect(isValidDominoTileId('6-6')).toBe(true)
    expect(isValidDominoTileId('domino-6-6')).toBe(true)
    expect(isValidDominoTileId('7-8')).toBe(false)
    expect(isValidDominoTileId('bad-value')).toBe(false)
  })

  it('returns stable public asset paths with safe fallback', () => {
    expect(getDominoImageSrc('6-4')).toBe(
      '/assets/dominoes-real-webp/domino-4-6.webp',
    )
    expect(getDominoImageSrc('6-4', { preferOptimized: true })).toBe(
      '/assets/dominoes-webp/domino-4-6.webp',
    )
    expect(
      getDominoImageSrc('6-4', {
        preferNormalized: true,
        preferOptimized: true,
      }),
    ).toBe('/assets/dominoes-normalized-webp/domino-4-6.webp')
    expect(getDominoImageSrc('bad-value')).toBe(
      '/assets/dominoes-real-webp/domino-back.webp',
    )
    expect(getDominoBackSrc()).toBe(
      '/assets/dominoes-real-webp/domino-back.webp',
    )
    expect(getTableImageSrc()).toBe('/assets/tables/domino-table.png')
  })

  it('orders real assets before existing image fallbacks', () => {
    expect(getDominoImageFallbackSources('domino-2-6')).toEqual([
      '/assets/dominoes-real-webp/domino-2-6.webp',
      '/assets/dominoes-webp/domino-2-6.webp',
      '/assets/dominoes/domino-2-6.png',
    ])
  })

  it('returns ordered optimized and fallback candidates for tile images', () => {
    expect(getDominoAssetCandidates('6-4')).toEqual({
      realSrc: '/assets/dominoes-real-webp/domino-4-6.webp',
      normalizedSrc: '/assets/dominoes-normalized-webp/domino-4-6.webp',
      optimizedSrc: '/assets/dominoes-webp/domino-4-6.webp',
      pngSrc: '/assets/dominoes/domino-4-6.png',
    })
    expect(getDominoAssetCandidates('not-a-tile')).toEqual({
      realSrc: '/assets/dominoes-real-webp/domino-back.webp',
      normalizedSrc: '/assets/dominoes-normalized-webp/domino-back.webp',
      optimizedSrc: '/assets/dominoes-webp/domino-back.webp',
      pngSrc: '/assets/dominoes/domino-back.png',
    })
    expect(getDominoAssetCandidates('domino-6-4')).toEqual({
      realSrc: '/assets/dominoes-real-webp/domino-4-6.webp',
      normalizedSrc: '/assets/dominoes-normalized-webp/domino-4-6.webp',
      optimizedSrc: '/assets/dominoes-webp/domino-4-6.webp',
      pngSrc: '/assets/dominoes/domino-4-6.png',
    })
  })
})
