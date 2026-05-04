import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const dominoesDir = path.join(projectRoot, 'public', 'assets', 'dominoes')
const optimizedDir = path.join(projectRoot, 'public', 'assets', 'dominoes-webp')
const largeFileThresholdBytes = 500 * 1024

const ignoredNames = new Set(['domino-contact-sheet.png'])
const ignoredDirectories = new Set(['originals-backup'])

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

function createRequiredTileNames() {
  const names = []

  for (let low = 0; low <= 6; low += 1) {
    for (let high = low; high <= 6; high += 1) {
      names.push(`domino-${low}-${high}.png`)
    }
  }

  return names
}

async function walk(directory, relativeBase = '') {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const paths = []

  for (const entry of entries) {
    const relativePath = path.join(relativeBase, entry.name)
    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      paths.push(relativePath)
      paths.push(...(await walk(fullPath, relativePath)))
    } else {
      paths.push(relativePath)
    }
  }

  return paths
}

async function readImageMetadata(fullPath) {
  try {
    const metadata = await sharp(fullPath).metadata()

    return `${metadata.width ?? '?'}x${metadata.height ?? '?'}`
  } catch {
    return 'unreadable'
  }
}

async function main() {
  const allRelativePaths = await walk(dominoesDir)
  const macMetadata = allRelativePaths.filter((relativePath) => {
    const parts = relativePath.split(path.sep)
    const filename = parts.at(-1) ?? ''

    return (
      parts.includes('__MACOSX') ||
      filename === '.DS_Store' ||
      filename.startsWith('._')
    )
  })
  const directEntries = await fs.readdir(dominoesDir, { withFileTypes: true })
  const directFiles = directEntries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
  const auditFiles = directFiles
    .filter((filename) => filename.endsWith('.png'))
    .filter((filename) => !ignoredNames.has(filename))
    .filter((filename) => /^domino-(?:[0-6]-[0-6]|back)\.png$/.test(filename))
    .sort((first, second) =>
      first.localeCompare(second, undefined, { numeric: true }),
    )
  const skippedDirectories = directEntries
    .filter((entry) => entry.isDirectory() && ignoredDirectories.has(entry.name))
    .map((entry) => entry.name)
  const requiredTiles = createRequiredTileNames()
  const missingTiles = requiredTiles.filter((filename) => !directFiles.includes(filename))
  const hasBack = directFiles.includes('domino-back.png')
  const fileRows = []
  let totalBytes = 0

  for (const filename of auditFiles) {
    const fullPath = path.join(dominoesDir, filename)
    const stat = await fs.stat(fullPath)
    const dimensions = await readImageMetadata(fullPath)

    totalBytes += stat.size
    fileRows.push({
      dimensions,
      filename,
      isLarge: stat.size > largeFileThresholdBytes,
      size: stat.size,
    })
  }

  console.log('Domino Vibes asset audit')
  console.log(`Directory: ${dominoesDir}`)
  console.log(`Required fronts found: ${requiredTiles.length - missingTiles.length}/${requiredTiles.length}`)
  console.log(`Domino back found: ${hasBack ? 'yes' : 'no'}`)
  console.log(`Audited files: ${fileRows.length}`)
  console.log(`Total audited PNG size: ${formatBytes(totalBytes)}`)

  if (skippedDirectories.length > 0) {
    console.log(`Skipped backup folders: ${skippedDirectories.join(', ')}`)
  }

  console.log('\nFiles')
  for (const row of fileRows) {
    const marker = row.isLarge ? '  WARN large' : ''
    console.log(
      `- ${row.filename.padEnd(16)} ${formatBytes(row.size).padStart(9)} ${row.dimensions}${marker}`,
    )
  }

  const largeFiles = fileRows.filter((row) => row.isLarge)

  try {
    const optimizedEntries = await fs.readdir(optimizedDir, { withFileTypes: true })
    const optimizedFiles = optimizedEntries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((filename) => /^domino-(?:[0-6]-[0-6]|back)\.webp$/.test(filename))
      .sort((first, second) =>
        first.localeCompare(second, undefined, { numeric: true }),
      )
    let optimizedBytes = 0

    for (const filename of optimizedFiles) {
      const stat = await fs.stat(path.join(optimizedDir, filename))
      optimizedBytes += stat.size
    }

    if (optimizedFiles.length > 0) {
      console.log('\nOptimized WebP assets')
      console.log(`Directory: ${optimizedDir}`)
      console.log(`Files found: ${optimizedFiles.length}`)
      console.log(`Total optimized size: ${formatBytes(optimizedBytes)}`)
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      console.log('\nOptimized WebP assets: not generated yet.')
    } else {
      throw error
    }
  }

  if (largeFiles.length > 0) {
    console.log('\nLarge asset warnings')
    for (const row of largeFiles) {
      console.log(`- ${row.filename}: ${formatBytes(row.size)} exceeds ${formatBytes(largeFileThresholdBytes)}`)
    }
  }

  if (macMetadata.length > 0) {
    console.log('\nMac metadata warnings')
    for (const relativePath of macMetadata) {
      console.log(`- ${relativePath}`)
    }
  }

  if (missingTiles.length > 0 || !hasBack) {
    console.error('\nMissing required assets')

    for (const filename of missingTiles) {
      console.error(`- ${filename}`)
    }

    if (!hasBack) {
      console.error('- domino-back.png')
    }

    process.exit(1)
  }

  console.log('\nAsset audit complete.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
