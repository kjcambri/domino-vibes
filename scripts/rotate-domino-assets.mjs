import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const dominoesDir = path.join(projectRoot, 'public', 'assets', 'dominoes')
const backupDir = path.join(dominoesDir, 'originals-backup')

function normalizeInput(input) {
  const trimmed = input.trim()

  if (/^domino-[0-6]-[0-6]\.png$/.test(trimmed)) {
    return trimmed
  }

  if (/^[0-6]-[0-6]$/.test(trimmed)) {
    const [first, second] = trimmed.split('-').map(Number)
    const low = Math.min(first, second)
    const high = Math.max(first, second)

    return `domino-${low}-${high}.png`
  }

  throw new Error(
    `Invalid tile "${input}". Use a tile id like 2-6 or filename like domino-2-6.png.`,
  )
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function backupOriginal(filename) {
  await fs.mkdir(backupDir, { recursive: true })

  const sourcePath = path.join(dominoesDir, filename)
  const backupPath = path.join(backupDir, filename)

  if (!(await fileExists(backupPath))) {
    await fs.copyFile(sourcePath, backupPath)
  }
}

async function rotateFile(filename) {
  if (filename === 'domino-back.png') {
    throw new Error('Refusing to rotate domino-back.png')
  }

  const filePath = path.join(dominoesDir, filename)

  if (!(await fileExists(filePath))) {
    throw new Error(`Missing asset: ${filePath}`)
  }

  await backupOriginal(filename)

  const rotatedBuffer = await sharp(filePath).rotate(180).png().toBuffer()
  await fs.writeFile(filePath, rotatedBuffer)
}

async function main() {
  const inputs = process.argv.slice(2)

  if (inputs.length === 0) {
    console.error('Usage: node scripts/rotate-domino-assets.mjs 0-1 domino-2-6.png')
    process.exit(1)
  }

  const filenames = [...new Set(inputs.map(normalizeInput))]

  for (const filename of filenames) {
    await rotateFile(filename)
    console.log(`Rotated ${filename}`)
  }

  console.log(`Done. Backups are in ${backupDir}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
