import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const defaultSourceDir = path.join(os.homedir(), 'Desktop', 'Real Domino Assets')
const outputDir = path.join(projectRoot, 'public', 'assets', 'dominoes-real-webp')
const outputWidth = 320
const outputHeight = 640
const innerWidth = 288
const innerHeight = 576
const quality = 90
const largeOutputThresholdBytes = 180 * 1024
const allowedExtensions = new Set(['.png', '.webp', '.jpg', '.jpeg'])

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

function normalizeSourceDir(value) {
  if (!value) {
    return defaultSourceDir
  }

  if (value.startsWith('~/')) {
    return path.join(os.homedir(), value.slice(2))
  }

  return path.resolve(value)
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function getSourceAssetMap(sourceDir) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })
  const sourceAssets = new Map()
  const ignored = []
  const extras = []

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name === '__MACOSX' || entry.name === 'originals-backup') {
        ignored.push(entry.name)
      } else {
        extras.push(`${entry.name}/`)
      }

      continue
    }

    if (!entry.isFile()) {
      continue
    }

    if (
      entry.name === '.DS_Store' ||
      entry.name.startsWith('._') ||
      entry.name === 'domino-contact-sheet.png'
    ) {
      ignored.push(entry.name)
      continue
    }

    const parsed = path.parse(entry.name)
    const extension = parsed.ext.toLowerCase()

    if (!allowedExtensions.has(extension)) {
      extras.push(entry.name)
      continue
    }

    if (!requiredAssetIds.includes(parsed.name)) {
      extras.push(entry.name)
      continue
    }

    if (sourceAssets.has(parsed.name)) {
      throw new Error(`Duplicate source asset for ${parsed.name}`)
    }

    sourceAssets.set(parsed.name, {
      filename: entry.name,
      fullPath: path.join(sourceDir, entry.name),
    })
  }

  return { extras, ignored, sourceAssets }
}

async function importAsset({ assetId, source }) {
  const inputStat = await fs.stat(source.fullPath)
  const sourceImage = sharp(source.fullPath).ensureAlpha()
  const metadata = await sourceImage.metadata()
  const warnings = []

  await sourceImage
    .trim({
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      threshold: 10,
    })
    .resize({
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      fit: 'contain',
      height: innerHeight,
      width: innerWidth,
    })
    .extend({
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      bottom: Math.floor((outputHeight - innerHeight) / 2),
      left: Math.floor((outputWidth - innerWidth) / 2),
      right: Math.ceil((outputWidth - innerWidth) / 2),
      top: Math.ceil((outputHeight - innerHeight) / 2),
    })
    .sharpen({ sigma: 0.25 })
    .webp({
      alphaQuality: 92,
      effort: 5,
      quality,
    })
    .toFile(path.join(outputDir, `${assetId}.webp`))

  const outputStat = await fs.stat(path.join(outputDir, `${assetId}.webp`))

  if (outputStat.size > largeOutputThresholdBytes) {
    warnings.push(
      `large output ${formatBytes(outputStat.size)} exceeds ${formatBytes(largeOutputThresholdBytes)}`,
    )
  }

  return {
    assetId,
    inputBytes: inputStat.size,
    outputBytes: outputStat.size,
    sourceDimensions: `${metadata.width ?? '?'}x${metadata.height ?? '?'}`,
    sourceFilename: source.filename,
    warnings,
  }
}

async function main() {
  const sourceDir = normalizeSourceDir(process.argv[2])

  if (!(await fileExists(sourceDir))) {
    throw new Error(`Source folder not found: ${sourceDir}`)
  }

  const { extras, ignored, sourceAssets } = await getSourceAssetMap(sourceDir)
  const missingAssets = requiredAssetIds.filter((assetId) => !sourceAssets.has(assetId))

  console.log('Importing Domino Vibes real domino assets')
  console.log(`Source: ${sourceDir}`)
  console.log(`Output: ${outputDir}`)
  console.log(`Output canvas: ${outputWidth}x${outputHeight}`)
  console.log(`Inner tile fit: ${innerWidth}x${innerHeight}`)
  console.log(`WebP quality: ${quality}`)

  if (missingAssets.length > 0) {
    console.error('\nMissing required assets')
    for (const assetId of missingAssets) {
      console.error(`- ${assetId}`)
    }
    process.exit(1)
  }

  await fs.rm(outputDir, { force: true, recursive: true })
  await fs.mkdir(outputDir, { recursive: true })

  const results = []
  const allWarnings = []
  let totalInputBytes = 0
  let totalOutputBytes = 0

  for (const assetId of requiredAssetIds) {
    const source = sourceAssets.get(assetId)
    const result = await importAsset({ assetId, source })
    results.push(result)
    totalInputBytes += result.inputBytes
    totalOutputBytes += result.outputBytes

    console.log(
      `- ${result.sourceFilename} (${result.sourceDimensions}) -> ${result.assetId}.webp: ${formatBytes(result.inputBytes)} to ${formatBytes(result.outputBytes)}`,
    )

    for (const warning of result.warnings) {
      allWarnings.push(`${result.assetId}: ${warning}`)
    }
  }

  if (ignored.length > 0) {
    allWarnings.push(`ignored files/folders: ${ignored.join(', ')}`)
  }

  if (extras.length > 0) {
    allWarnings.push(`extra files/folders not imported: ${extras.join(', ')}`)
  }

  console.log('\nReal domino asset import complete.')
  console.log(`Files imported: ${results.length}`)
  console.log(`Output dimensions: ${outputWidth}x${outputHeight}`)
  console.log(`Source total: ${formatBytes(totalInputBytes)}`)
  console.log(`Real WebP output total: ${formatBytes(totalOutputBytes)}`)
  console.log(
    'Note: import normalizes canvas, padding, centering, and output format; visually inspect the contact sheet for pip orientation, lighting, shadows, and halos.',
  )

  if (allWarnings.length > 0) {
    console.log('\nWarnings')

    for (const warning of allWarnings) {
      console.log(`- ${warning}`)
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
