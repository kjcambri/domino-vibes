import { describe, expect, it } from 'vitest'
import {
  computeMiniBoardBounds,
  getMiniBoardTransform,
} from '../miniBoardPreviewUtils'

describe('MiniBoardPreview utilities', () => {
  it('computes bounds across multiple saved placements', () => {
    const bounds = computeMiniBoardBounds([
      {
        x: 0,
        y: 0,
        rotation: 0,
        orientation: 'vertical',
      },
      {
        x: 56,
        y: 0,
        rotation: 90,
        orientation: 'horizontal',
      },
    ])

    expect(bounds.minX).toBe(-14)
    expect(bounds.maxX).toBe(84)
    expect(bounds.minY).toBe(-28)
    expect(bounds.maxY).toBe(28)
    expect(bounds.width).toBe(98)
    expect(bounds.height).toBe(56)
  })

  it('scales long chains down to fit the mini board viewport', () => {
    const transform = getMiniBoardTransform({
      bounds: {
        minX: -260,
        maxX: 260,
        minY: -80,
        maxY: 80,
        width: 520,
        height: 160,
        centerX: 0,
        centerY: 0,
      },
      viewportHeight: 220,
      viewportWidth: 320,
    })

    expect(transform.scale).toBeLessThan(1)
    expect(transform.translateX).toBe(160)
    expect(transform.translateY).toBe(110)
  })
})
