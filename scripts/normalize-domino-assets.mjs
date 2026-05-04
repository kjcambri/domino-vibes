import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const inputDir = path.join(projectRoot, 'public', 'assets', 'dominoes')
const outputDir = path.join(
  projectRoot,
  'public',
  'assets',
  'dominoes-normalized-webp',
)
const outputWidth = 256
const outputHeight = 512
const quality = 90
const largeOutputThresholdBytes = 180 * 1024
const expectedSourceWidth = 1024
const expectedSourceHeight = 1536

const requiredFronts = Array.from({ length: 7 }, (_, left) =>
  Array.from({ length: 7 - left }, (_unused, offset) => {
    const right = left + offset

    return `domino-${left}-${right}.png`
  }),
).flat()

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

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function getSourceFiles() {
  const sourceFiles = []
  const missingFiles = []

  for (const filename of requiredFronts) {
    const inputPath = path.join(inputDir, filename)

    if (await fileExists(inputPath)) {
      sourceFiles.push(filename)
    } else {
      missingFiles.push(filename)
    }
  }

  if (await fileExists(path.join(inputDir, 'domino-back.png'))) {
    sourceFiles.push('domino-back.png')
  }

  return { missingFiles, sourceFiles }
}

async function normalizeFile(filename) {
  const inputPath = path.join(inputDir, filename)
  const outputFilename = filename.replace(/\.png$/i, '.webp')
  const outputPath = path.join(outputDir, outputFilename)
  const inputStat = await fs.stat(inputPath)
  const metadata = await sharp(inputPath).metadata()
  const warnings = []

  if (
    metadata.width !== expectedSourceWidth ||
    metadata.height !== expectedSourceHeight
  ) {
    warnings.push(
      `unexpected source dimensions ${metadata.width ?? '?'}x${metadata.height ?? '?'}`,
    )
  }

  await sharp(inputPath)
    .ensureAlpha()
    .trim({
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      threshold: 10,
    })
    .resize({
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      fit: 'contain',
      height: outputHeight,
      width: outputWidth,
    })
    .webp({
      alphaQuality: 92,
      effort: 5,
      quality,
    })
    .toFile(outputPath)

  const outputStat = await fs.stat(outputPath)

  if (outputStat.size > largeOutputThresholdBytes) {
    warnings.push(
      `large normalized output ${formatBytes(outputStat.size)} exceeds ${formatBytes(largeOutputThresholdBytes)}`,
    )
  }

  return {
    filename,
    inputBytes: inputStat.size,
    outputBytes: outputStat.size,
    outputFilename,
    warnings,
  }
}

async function main() {
  const { missingFiles, sourceFiles } = await getSourceFiles()

  if (sourceFiles.length === 0) {
    throw new Error(`No required domino PNG assets found in ${inputDir}`)
  }

  await fs.mkdir(outputDir, { recursive: true })

  let totalInputBytes = 0
  let totalOutputBytes = 0
  const allWarnings = []

  console.log('Normalizing Domino Vibes photo-style domino assets')
  console.log(`Input: ${inputDir}`)
  console.log(`Output: ${outputDir}`)
  console.log(`Output canvas: ${outputWidth}x${outputHeight}`)
  console.log(`Quality: ${quality}`)

  for (const filename of sourceFiles) {
    const result = await normalizeFile(filename)
    totalInputBytes += result.inputBytes
    totalOutputBytes += result.outputBytes

    console.log(
      `- ${result.filename} -> ${result.outputFilename}: ${formatBytes(result.inputBytes)} to ${formatBytes(result.outputBytes)}`,
    )

    for (const warning of result.warnings) {
      allWarnings.push(`${result.filename}: ${warning}`)
    }
  }

  for (const missingFile of missingFiles) {
    allWarnings.push(`missing required source ${missingFile}`)
  }

  console.log('\nNormalization complete.')
  console.log(`Files processed: ${sourceFiles.length}`)
  console.log(`Output dimensions: ${outputWidth}x${outputHeight}`)
  console.log(`Source total: ${formatBytes(totalInputBytes)}`)
  console.log(`Normalized output total: ${formatBytes(totalOutputBytes)}`)

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
