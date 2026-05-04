import { type VisualDominoPlacement } from '../../features/games/boardLayout'

const BOARD_TILE_SHORT = 28
const BOARD_TILE_LONG = 56
const MINI_BOARD_PADDING = 42

export type MiniBoardBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
  centerX: number
  centerY: number
}

type MiniBoardTransformInput = {
  bounds: MiniBoardBounds
  viewportWidth: number
  viewportHeight: number
  padding?: number
}

export function computeMiniBoardBounds(
  placements: Pick<
    VisualDominoPlacement,
    'orientation' | 'rotation' | 'x' | 'y'
  >[],
): MiniBoardBounds {
  if (placements.length === 0) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      width: BOARD_TILE_SHORT,
      height: BOARD_TILE_LONG,
      centerX: 0,
      centerY: 0,
    }
  }

  const boxes = placements.map((placement) => {
    const { height, width } = getVisualTileSize(placement)

    return {
      minX: placement.x - width / 2,
      maxX: placement.x + width / 2,
      minY: placement.y - height / 2,
      maxY: placement.y + height / 2,
    }
  })
  const minX = Math.min(...boxes.map((box) => box.minX))
  const maxX = Math.max(...boxes.map((box) => box.maxX))
  const minY = Math.min(...boxes.map((box) => box.minY))
  const maxY = Math.max(...boxes.map((box) => box.maxY))

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  }
}

export function getMiniBoardTransform({
  bounds,
  padding = MINI_BOARD_PADDING,
  viewportHeight,
  viewportWidth,
}: MiniBoardTransformInput) {
  const usableWidth = Math.max(1, viewportWidth - padding * 2)
  const usableHeight = Math.max(1, viewportHeight - padding * 2)
  const scale = Math.min(
    1.05,
    usableWidth / Math.max(bounds.width, BOARD_TILE_SHORT),
    usableHeight / Math.max(bounds.height, BOARD_TILE_LONG),
  )

  return {
    scale,
    translateX: viewportWidth / 2 - bounds.centerX * scale,
    translateY: viewportHeight / 2 - bounds.centerY * scale,
  }
}

function getVisualTileSize({
  orientation,
  rotation,
}: Pick<VisualDominoPlacement, 'orientation' | 'rotation'>) {
  const normalizedRotation = ((Math.round(rotation) % 180) + 180) % 180

  if (orientation === 'horizontal' || normalizedRotation === 90) {
    return {
      height: BOARD_TILE_SHORT,
      width: BOARD_TILE_LONG,
    }
  }

  return {
    height: BOARD_TILE_LONG,
    width: BOARD_TILE_SHORT,
  }
}
