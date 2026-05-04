import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const inputDir = path.join(projectRoot, 'public', 'assets', 'dominoes')
const outputDir = path.join(projectRoot, 'public', 'assets', 'dominoes-webp')
const maxHeight = 768
const quality = 88

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

async function getSourceFiles() {
  const entries = await fs.readdir(inputDir, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((filename) => /^domino-(?:[0-6]-[0-6]|back)\.png$/.test(filename))
    .sort((first, second) =>
      first.localeCompare(second, undefined, { numeric: true }),
    )
}

async function main() {
  const sourceFiles = await getSourceFiles()

  if (sourceFiles.length === 0) {
    throw new Error(`No domino PNG assets found in ${inputDir}`)
  }

  await fs.mkdir(outputDir, { recursive: true })

  let totalInputBytes = 0
  let totalOutputBytes = 0

  console.log('Optimizing domino assets to WebP')
  console.log(`Input: ${inputDir}`)
  console.log(`Output: ${outputDir}`)
  console.log(`Quality: ${quality}, max height: ${maxHeight}px`)

  for (const filename of sourceFiles) {
    const inputPath = path.join(inputDir, filename)
    const outputFilename = filename.replace(/\.png$/i, '.webp')
    const outputPath = path.join(outputDir, outputFilename)
    const inputStat = await fs.stat(inputPath)

    await sharp(inputPath)
      .resize({
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({
        alphaQuality: 90,
        effort: 5,
        quality,
      })
      .toFile(outputPath)

    const outputStat = await fs.stat(outputPath)
    totalInputBytes += inputStat.size
    totalOutputBytes += outputStat.size
    console.log(
      `- ${filename} -> ${outputFilename}: ${formatBytes(inputStat.size)} to ${formatBytes(outputStat.size)}`,
    )
  }

  console.log('\nOptimization complete.')
  console.log(`Original PNG total: ${formatBytes(totalInputBytes)}`)
  console.log(`Optimized WebP total: ${formatBytes(totalOutputBytes)}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
