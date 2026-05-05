import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const dominoesDir = path.join(projectRoot, 'public', 'assets', 'dominoes')
const normalizedDominoesDir = path.join(
  projectRoot,
  'public',
  'assets',
  'dominoes-normalized-webp',
)
const outputPath = path.join(dominoesDir, 'domino-contact-sheet.png')
const normalizedOutputPath = path.join(
  projectRoot,
  'public',
  'assets',
  'dominoes-normalized-contact-sheet.png',
)
const allowedContactSheetExtensions = ['png', 'webp', 'jpg', 'jpeg']

const tileWidth = 96
const tileHeight = 144
const labelHeight = 28
const cellWidth = 132
const cellHeight = tileHeight + labelHeight + 22
const columns = 7
const sheetPadding = 24

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function createLabelSvg(filename) {
  return Buffer.from(`
    <svg width="${cellWidth}" height="${labelHeight}" viewBox="0 0 ${cellWidth} ${labelHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="rgba(5, 28, 19, 0.78)" rx="6" />
      <text x="50%" y="18" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#f8efd3">${escapeXml(filename)}</text>
    </svg>
  `)
}

async function getDominoFiles(sourceDir, extension) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter(
      (filename) =>
        new RegExp(`^domino-[0-6]-[0-6]\\.${extension}$`).test(filename) ||
        filename === `domino-back.${extension}`,
    )
    .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }))
}

async function getDominoFilesByKnownExtensions(sourceDir) {
  const files = []

  for (const extension of allowedContactSheetExtensions) {
    files.push(...(await getDominoFiles(sourceDir, extension)))
  }

  return files.sort((first, second) =>
    first.localeCompare(second, undefined, { numeric: true }),
  )
}

async function createContactSheet({
  extension,
  files,
  output,
  sourceDir,
  title,
}) {
  if (files.length === 0) {
    throw new Error(`No domino tile ${extension.toUpperCase()} files found in ${sourceDir}`)
  }

  const rows = Math.ceil(files.length / columns)
  const sheetWidth = sheetPadding * 2 + columns * cellWidth
  const sheetHeight = sheetPadding * 2 + rows * cellHeight
  const composites = []

  for (const [index, filename] of files.entries()) {
    const column = index % columns
    const row = Math.floor(index / columns)
    const cellLeft = sheetPadding + column * cellWidth
    const cellTop = sheetPadding + row * cellHeight
    const tileBuffer = await sharp(path.join(sourceDir, filename))
      .resize({
        width: tileWidth,
        height: tileHeight,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer()

    composites.push({
      input: tileBuffer,
      left: cellLeft + Math.round((cellWidth - tileWidth) / 2),
      top: cellTop,
    })
    composites.push({
      input: createLabelSvg(filename),
      left: cellLeft,
      top: cellTop + tileHeight + 10,
    })
  }

  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: { r: 7, g: 51, b: 33, alpha: 1 },
    },
  })
    .composite([
      {
        input: Buffer.from(`
          <svg width="${sheetWidth}" height="${sheetHeight}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#073321" />
            <rect x="10" y="10" width="${sheetWidth - 20}" height="${sheetHeight - 20}" rx="18" fill="none" stroke="rgba(217,184,102,0.35)" stroke-width="2" />
            <text x="${sheetPadding}" y="18" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="700" fill="#d9b866">${escapeXml(title)}</text>
          </svg>
        `),
        left: 0,
        top: 0,
      },
      ...composites,
    ])
    .png()
    .toFile(output)

  console.log(`Created contact sheet with ${files.length} tiles:`)
  console.log(output)
}

function readArg(name) {
  const index = process.argv.indexOf(name)

  if (index === -1) {
    return null
  }

  return process.argv[index + 1] ?? null
}

async function createCustomContactSheetIfRequested() {
  const sourceArg = readArg('--source')

  if (!sourceArg) {
    return false
  }

  const outputArg = readArg('--output')
  const titleArg = readArg('--title')
  const sourceDir = path.resolve(projectRoot, sourceArg)
  const output = outputArg
    ? path.resolve(projectRoot, outputArg)
    : path.join(projectRoot, 'public', 'assets', 'domino-contact-sheet-custom.png')
  const files = await getDominoFilesByKnownExtensions(sourceDir)

  await createContactSheet({
    extension: 'image',
    files,
    output,
    sourceDir,
    title:
      titleArg ??
      'Domino Vibes contact sheet: expected low-on-top / high-on-bottom',
  })

  return true
}

async function main() {
  if (await createCustomContactSheetIfRequested()) {
    return
  }

  const pngFiles = await getDominoFiles(dominoesDir, 'png')

  await createContactSheet({
    extension: 'png',
    files: pngFiles,
    output: outputPath,
    sourceDir: dominoesDir,
    title: 'Domino Vibes source PNG audit: expected low-on-top / high-on-bottom',
  })

  try {
    const normalizedFiles = await getDominoFiles(normalizedDominoesDir, 'webp')

    await createContactSheet({
      extension: 'webp',
      files: normalizedFiles,
      output: normalizedOutputPath,
      sourceDir: normalizedDominoesDir,
      title: 'Domino Vibes normalized WebP audit: candidate set, not default',
    })
  } catch (error) {
    console.warn(
      `Skipped normalized contact sheet: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }

}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
