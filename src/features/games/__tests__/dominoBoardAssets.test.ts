import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

const projectRoot = path.resolve(import.meta.dirname, '../../../..')
const boardAssetDir = path.join(
  projectRoot,
  'public',
  'assets',
  'dominoes-real-board-webp',
)

const requiredAssetNames = [
  ...Array.from({ length: 7 }, (_unused, left) =>
    Array.from({ length: 7 - left }, (_nestedUnused, offset) => {
      const right = left + offset

      return `domino-${left}-${right}.webp`
    }),
  ).flat(),
  'domino-back.webp',
]

type Bounds = {
  bottom: number
  height: number
  left: number
  right: number
  top: number
  width: number
}

function isCreamBodyPixel(red: number, green: number, blue: number, alpha: number) {
  if (alpha < 120) {
    return false
  }

  const maxChannel = Math.max(red, green, blue)
  const minChannel = Math.min(red, green, blue)

  return red > 150 && green > 125 && blue > 80 && maxChannel - minChannel < 95
}

async function getBounds(
  filename: string,
  predicate: (red: number, green: number, blue: number, alpha: number) => boolean,
) {
  const image = sharp(path.join(boardAssetDir, filename)).ensureAlpha()
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  let minX = info.width
  let minY = info.height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const index = (y * info.width + x) * info.channels

      if (
        predicate(
          data[index]!,
          data[index + 1]!,
          data[index + 2]!,
          data[index + 3]!,
        )
      ) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  if (maxX < 0 || maxY < 0) {
    return null
  }

  return {
    bottom: info.height - 1 - maxY,
    height: maxY - minY + 1,
    left: minX,
    right: info.width - 1 - maxX,
    top: minY,
    width: maxX - minX + 1,
  } satisfies Bounds
}

describe('board-calibrated domino assets', () => {
  it('includes every domino front and back tile', async () => {
    const files = await fs.readdir(boardAssetDir)

    for (const assetName of requiredAssetNames) {
      expect(files).toContain(assetName)
    }
  })

  it('uses one consistent board asset canvas size', async () => {
    for (const assetName of requiredAssetNames) {
      const metadata = await sharp(path.join(boardAssetDir, assetName)).metadata()

      expect(metadata.width).toBe(320)
      expect(metadata.height).toBe(640)
    }
  })

  it('keeps sampled front tile body footprints aligned within a narrow tolerance', async () => {
    const sampledAssets = [
      'domino-1-2.webp',
      'domino-1-6.webp',
      'domino-4-5.webp',
      'domino-4-6.webp',
      'domino-6-6.webp',
    ]
    const bodyBounds = await Promise.all(
      sampledAssets.map((assetName) => getBounds(assetName, isCreamBodyPixel)),
    )
    const widths = bodyBounds.map((bounds) => bounds?.width ?? 0)
    const heights = bodyBounds.map((bounds) => bounds?.height ?? 0)

    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(8)
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(8)

    for (const bounds of bodyBounds) {
      expect(bounds).not.toBeNull()
      expect(Math.abs(bounds!.left - bounds!.right)).toBeLessThanOrEqual(6)
      expect(Math.abs(bounds!.top - bounds!.bottom)).toBeLessThanOrEqual(10)
    }
  })
})
