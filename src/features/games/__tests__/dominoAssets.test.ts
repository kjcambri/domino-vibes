import { describe, expect, it } from 'vitest'
import {
  getDominoBackSrc,
  getDominoImageSrc,
  getTableImageSrc,
  isValidDominoTileId,
  normalizeTileId,
} from '../dominoAssets'

describe('dominoAssets', () => {
  it('keeps low-high tile ids unchanged', () => {
    expect(normalizeTileId('0-0')).toBe('0-0')
    expect(normalizeTileId('4-6')).toBe('4-6')
  })

  it('normalizes reversed tile ids to backend low-high format', () => {
    expect(normalizeTileId('6-4')).toBe('4-6')
  })

  it('validates only double-six tile ids', () => {
    expect(isValidDominoTileId('6-6')).toBe(true)
    expect(isValidDominoTileId('7-8')).toBe(false)
    expect(isValidDominoTileId('bad-value')).toBe(false)
  })

  it('returns stable public asset paths with safe fallback', () => {
    expect(getDominoImageSrc('6-4')).toBe('/assets/dominoes/domino-4-6.png')
    expect(getDominoImageSrc('bad-value')).toBe('/assets/dominoes/domino-back.png')
    expect(getDominoBackSrc()).toBe('/assets/dominoes/domino-back.png')
    expect(getTableImageSrc()).toBe('/assets/tables/domino-table.png')
  })
})
