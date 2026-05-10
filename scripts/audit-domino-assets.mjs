import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const dominoAssetsSourcePath = path.join(
  projectRoot,
  'src',
  'features',
  'games',
  'dominoAssets.ts',
)

const requiredAssetIds = [
  ...Array.from({ length: 7 }, (_unused, left) =>
    Array.from({ length: 7 - left }, (_nestedUnused, offset) => {
      const right = left + offset

      return `domino-${left}-${right}`
    }),
  ).flat(),
  'domino-back',
]

const folders = [
  {
    directory: path.join(projectRoot, 'public', 'assets', 'dominoes'),
    extension: 'png',
    key: 'original',
    label: 'Original PNG assets',
    largeFileThresholdBytes: 500 * 1024,
  },
  {
    directory: path.join(projectRoot, 'public', 'assets', 'dominoes-webp'),
    extension: 'webp',
    key: 'optimized',
    label: 'Optimized WebP fallback assets',
    largeFileThresholdBytes: 180 * 1024,
  },
  {
    directory: path.join(projectRoot, 'public', 'assets', 'dominoes-normalized-webp'),
    extension: 'webp',
    key: 'normalized',
    label: 'Normalized WebP candidate assets',
    largeFileThresholdBytes: 180 * 1024,
  },
  {
    directory: path.join(projectRoot, 'public', 'assets', 'dominoes-real-board-webp'),
    extension: 'webp',
    key: 'realBoard',
    label: 'Real WebP board-calibrated assets',
    largeFileThresholdBytes: 180 * 1024,
  },
  {
    directory: path.join(projectRoot, 'public', 'assets', 'dominoes-real-webp'),
    extension: 'webp',
    key: 'real',
    label: 'Real WebP primary assets',
    largeFileThresholdBytes: 180 * 1024,
  },
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

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function walk(directory, relativeBase = '') {
  if (!(await fileExists(directory))) {
    return []
  }

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

async function readImageDimensions(fullPath) {
  try {
    const metadata = await sharp(fullPath).metadata()

    return `${metadata.width ?? '?'}x${metadata.height ?? '?'}`
  } catch {
    return 'unreadable'
  }
}

async function readDefaultFlags() {
  const source = await fs.readFile(dominoAssetsSourcePath, 'utf8')

  return {
    useNormalized: /USE_NORMALIZED_DOMINO_ASSETS\s*=\s*true/.test(source),
    useProcedural: /USE_PROCEDURAL_DOMINOES\s*=\s*true/.test(source),
    useRealBoard: /USE_REAL_BOARD_DOMINO_ASSETS\s*=\s*true/.test(source),
    useReal: /USE_REAL_DOMINO_ASSETS\s*=\s*true/.test(source),
  }
}

async function auditFolder(folder) {
  const result = {
    ...folder,
    backFound: false,
    dimensions: new Map(),
    files: [],
    frontsFound: 0,
    isPresent: await fileExists(folder.directory),
    missing: [],
    totalBytes: 0,
    warnings: [],
  }

  if (!result.isPresent) {
    result.missing = requiredAssetIds.map(
      (assetId) => `${assetId}.${folder.extension}`,
    )
    result.warnings.push('folder not found')
    return result
  }

  const entries = await fs.readdir(folder.directory, { withFileTypes: true })
  const directFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
  const directFileSet = new Set(directFiles)
  const requiredFiles = requiredAssetIds.map(
    (assetId) => `${assetId}.${folder.extension}`,
  )

  result.missing = requiredFiles.filter((filename) => !directFileSet.has(filename))
  result.backFound = directFileSet.has(`domino-back.${folder.extension}`)

  for (const filename of requiredFiles.filter((file) => directFileSet.has(file))) {
    const fullPath = path.join(folder.directory, filename)
    const stat = await fs.stat(fullPath)
    const dimensions = await readImageDimensions(fullPath)

    result.totalBytes += stat.size
    result.dimensions.set(dimensions, (result.dimensions.get(dimensions) ?? 0) + 1)

    if (/^domino-[0-6]-[0-6]\./.test(filename)) {
      result.frontsFound += 1
    }

    result.files.push({
      dimensions,
      filename,
      isLarge: stat.size > folder.largeFileThresholdBytes,
      size: stat.size,
    })
  }

  return result
}

async function main() {
  const flags = await readDefaultFlags()
  const audits = []
  const allWarnings = []

  console.log('Domino Vibes asset audit')
  console.log(
    `Defaults: real=${flags.useReal}, realBoard=${flags.useRealBoard}, normalized=${flags.useNormalized}, procedural=${flags.useProcedural}`,
  )

  for (const folder of folders) {
    const audit = await auditFolder(folder)
    audits.push(audit)

    console.log(`\n${audit.label}`)
    console.log(`Directory: ${audit.directory}`)
    console.log(`Required fronts found: ${audit.frontsFound}/28`)
    console.log(`Domino back found: ${audit.backFound ? 'yes' : 'no'}`)
    console.log(`Audited files: ${audit.files.length}`)
    console.log(`Total size: ${formatBytes(audit.totalBytes)}`)
    console.log(
      `Dimensions: ${
        audit.dimensions.size > 0
          ? [...audit.dimensions.entries()]
              .map(([dimensions, count]) => `${dimensions} (${count})`)
              .join(', ')
          : 'none'
      }`,
    )

    const largeFiles = audit.files.filter((file) => file.isLarge)

    if (largeFiles.length > 0) {
      audit.warnings.push(
        `${largeFiles.length} large file(s): ${largeFiles
          .map((file) => `${file.filename} ${formatBytes(file.size)}`)
          .join(', ')}`,
      )
    }

    if (audit.missing.length > 0) {
      audit.warnings.push(`missing required files: ${audit.missing.join(', ')}`)
    }

    if (audit.warnings.length > 0) {
      console.log('Warnings:')
      for (const warning of audit.warnings) {
        console.log(`- ${warning}`)
        allWarnings.push(`${audit.key}: ${warning}`)
      }
    }
  }

  const dominoAssetFolders = await walk(path.join(projectRoot, 'public', 'assets'))
  const macMetadata = dominoAssetFolders.filter((relativePath) => {
    const parts = relativePath.split(path.sep)
    const filename = parts.at(-1) ?? ''

    return (
      parts.includes('__MACOSX') ||
      filename === '.DS_Store' ||
      filename.startsWith('._')
    )
  })

  if (macMetadata.length > 0) {
    console.log('\nMac metadata warnings')
    for (const relativePath of macMetadata) {
      console.log(`- ${relativePath}`)
      allWarnings.push(`mac metadata: ${relativePath}`)
    }
  }

  const defaultAudit = flags.useRealBoard
    ? audits.find((audit) => audit.key === 'realBoard')
    : flags.useReal
      ? audits.find((audit) => audit.key === 'real')
      : audits.find((audit) => audit.key === 'optimized')

  if (defaultAudit && defaultAudit.missing.length > 0) {
    console.error(
      `\nDefault domino asset folder is incomplete: ${defaultAudit.label}`,
    )
    process.exit(1)
  }

  if (allWarnings.length > 0) {
    console.log('\nAsset audit completed with warnings.')
  } else {
    console.log('\nAsset audit complete.')
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
