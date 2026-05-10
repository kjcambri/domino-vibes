import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const defaultInputDir = path.join(
  projectRoot,
  'public',
  'assets',
  'dominoes-real-webp',
)
const outputDir = path.join(
  projectRoot,
  'public',
  'assets',
  'dominoes-real-board-webp',
)
const outputWidth = 320
const outputHeight = 640
const targetBodyWidth = 292
const targetBodyHeight = 604
const quality = 90

const requiredAssetIds = [
  ...Array.from({ length: 7 }, (_unused, left) =>
    Array.from({ length: 7 - left }, (_nestedUnused, offset) => {
      const right = left + offset

      return `domino-${left}-${right}`
    }),
  ).flat(),
  'domino-back',
]

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const kb = bytes / 1024

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }

  return `${(kb / 1024).toFixed(2)} MB`
}

function normalizeInputDir(value) {
  return value ? path.resolve(value) : defaultInputDir
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

function isCreamBodyPixel(red, green, blue, alpha) {
  if (alpha < 120) {
    return false
  }

  const maxChannel = Math.max(red, green, blue)
  const minChannel = Math.min(red, green, blue)

  return red > 150 && green > 125 && blue > 80 && maxChannel - minChannel < 95
}

async function getPixelBounds(inputPath, predicate) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  let minX = info.width
  let minY = info.height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const index = (y * info.width + x) * info.channels

      if (
        predicate(data[index], data[index + 1], data[index + 2], data[index + 3])
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
    height: maxY - minY + 1,
    left: minX,
    top: minY,
    width: maxX - minX + 1,
  }
}

function getCropFromBounds(bounds, metadata) {
  const xPadding = Math.max(
    6,
    Math.round((bounds.width * (outputWidth - targetBodyWidth)) / targetBodyWidth / 2),
  )
  const yPadding = Math.max(
    8,
    Math.round(
      (bounds.height * (outputHeight - targetBodyHeight)) / targetBodyHeight / 2,
    ),
  )
  const left = Math.max(0, bounds.left - xPadding)
  const top = Math.max(0, bounds.top - yPadding)
  const right = Math.min(
    metadata.width ?? outputWidth,
    bounds.left + bounds.width + xPadding,
  )
  const bottom = Math.min(
    metadata.height ?? outputHeight,
    bounds.top + bounds.height + yPadding,
  )

  return {
    height: Math.max(1, bottom - top),
    left,
    top,
    width: Math.max(1, right - left),
  }
}

async function calibrateFrontAsset(inputPath, outputPath) {
  const metadata = await sharp(inputPath).metadata()
  const bodyBounds = await getPixelBounds(inputPath, isCreamBodyPixel)

  if (!bodyBounds) {
    throw new Error(`Could not find cream body bounds in ${inputPath}`)
  }

  const crop = getCropFromBounds(bodyBounds, metadata)

  await sharp(inputPath)
    .ensureAlpha()
    .extract(crop)
    .resize({
      fit: 'fill',
      height: outputHeight,
      kernel: sharp.kernel.lanczos3,
      width: outputWidth,
    })
    .sharpen({ sigma: 0.2 })
    .webp({
      alphaQuality: 92,
      effort: 5,
      quality,
    })
    .toFile(outputPath)

  return { bodyBounds, crop }
}

async function calibrateBackAsset(inputPath, outputPath) {
  await sharp(inputPath)
    .ensureAlpha()
    .trim({
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      threshold: 10,
    })
    .resize({
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      fit: 'contain',
      height: targetBodyHeight,
      kernel: sharp.kernel.lanczos3,
      width: targetBodyWidth,
    })
    .extend({
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      bottom: Math.floor((outputHeight - targetBodyHeight) / 2),
      left: Math.floor((outputWidth - targetBodyWidth) / 2),
      right: Math.ceil((outputWidth - targetBodyWidth) / 2),
      top: Math.ceil((outputHeight - targetBodyHeight) / 2),
    })
    .sharpen({ sigma: 0.2 })
    .webp({
      alphaQuality: 92,
      effort: 5,
      quality,
    })
    .toFile(outputPath)
}

async function main() {
  const inputDir = normalizeInputDir(process.argv[2])

  if (!(await fileExists(inputDir))) {
    throw new Error(`Input folder not found: ${inputDir}`)
  }

  const missingAssets = []

  for (const assetId of requiredAssetIds) {
    const inputPath = path.join(inputDir, `${assetId}.webp`)

    if (!(await fileExists(inputPath))) {
      missingAssets.push(`${assetId}.webp`)
    }
  }

  console.log('Calibrating Domino Vibes board domino assets')
  console.log(`Input: ${inputDir}`)
  console.log(`Output: ${outputDir}`)
  console.log(`Canvas: ${outputWidth}x${outputHeight}`)
  console.log(`Target body footprint: ${targetBodyWidth}x${targetBodyHeight}`)

  if (missingAssets.length > 0) {
    console.error('\nMissing required real WebP assets')
    for (const assetName of missingAssets) {
      console.error(`- ${assetName}`)
    }
    process.exit(1)
  }

  await fs.rm(outputDir, { force: true, recursive: true })
  await fs.mkdir(outputDir, { recursive: true })

  let totalInputBytes = 0
  let totalOutputBytes = 0

  for (const assetId of requiredAssetIds) {
    const inputPath = path.join(inputDir, `${assetId}.webp`)
    const outputPath = path.join(outputDir, `${assetId}.webp`)
    const inputStat = await fs.stat(inputPath)

    if (assetId === 'domino-back') {
      await calibrateBackAsset(inputPath, outputPath)
    } else {
      await calibrateFrontAsset(inputPath, outputPath)
    }

    const outputStat = await fs.stat(outputPath)
    totalInputBytes += inputStat.size
    totalOutputBytes += outputStat.size

    console.log(
      `- ${assetId}.webp: ${formatBytes(inputStat.size)} to ${formatBytes(outputStat.size)}`,
    )
  }

  console.log('\nBoard domino calibration complete.')
  console.log(`Files processed: ${requiredAssetIds.length}`)
  console.log(`Input total: ${formatBytes(totalInputBytes)}`)
  console.log(`Board WebP output total: ${formatBytes(totalOutputBytes)}`)
  console.log(
    'Note: board assets are calibrated for visual footprint consistency only; original real WebP assets remain the primary fallback for non-board rendering.',
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
