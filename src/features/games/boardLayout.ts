import { type BoardPlacementDto, type BoardSide } from './types'

type Direction = 'right' | 'left' | 'up' | 'down'
type DominoOrientation = 'horizontal' | 'vertical'
type ChainSide = Exclude<BoardSide, 'start'>
type HorizontalDirection = Extract<Direction, 'left' | 'right'>

type VisualEndpoint = {
  x: number
  y: number
  direction: Direction
  pendingDirection?: Direction
  isDoubleEndpoint?: boolean
  pip: number
  side: ChainSide
  row: number
  runCount: number
  horizontalRunCount: number
  verticalRunCount: number
  horizontalDirection: HorizontalDirection
  lastTurnDirection?: HorizontalDirection
}

type RotationTile = {
  left: number
  right: number
  isDouble: boolean
}

export type VisualDominoPlacement = {
  tileId: string
  x: number
  y: number
  rotation: number
  orientation: DominoOrientation
  isDouble: boolean
  isStart: boolean
  isLatest: boolean
  turnNumber: number
  playedBy: string
  side: BoardSide
  direction?: Direction
  connectedPip?: number | null
  exposedPip?: number | null
  connectedTileSide?: 'left' | 'right' | null
}

const REGULAR_SHORT = 28
const PIP_CELL_SIZE = REGULAR_SHORT
const CONNECTION_GAP = 0
const HORIZONTAL_RUN_LENGTH = 4
const VERTICAL_RUN_LENGTH = 2
const MIN_X = -240
const MAX_X = 240
const MIN_Y = -260
const MAX_Y = 260

export function createDominoBoardLayout(
  placements: BoardPlacementDto[],
): VisualDominoPlacement[] {
  if (placements.length === 0) {
    return []
  }

  const sortedPlacements = [...placements].sort(
    (first, second) => first.turnNumber - second.turnNumber,
  )
  const latestTurnNumber = Math.max(
    ...sortedPlacements.map((placement) => placement.turnNumber),
  )

  if (sortedPlacements.every(hasSavedVisualGeometry)) {
    return sortedPlacements.map((placement) =>
      toVisualPlacement(placement, {
        x: placement.x!,
        y: placement.y!,
        orientation: placement.orientation!,
        rotation: placement.rotation!,
        isStart: placement.side === 'start',
        isLatest: placement.turnNumber === latestTurnNumber,
        connectedPip: placement.connectedPip,
        exposedPip: placement.exposedPip,
      }),
    )
  }

  const startPlacement =
    sortedPlacements.find((placement) => placement.side === 'start') ??
    sortedPlacements[0]!
  const startOrientation = getStartOrientation(startPlacement)
  const startEndpointOffset = getStartEndpointOffset(startPlacement)
  const leftPlacements = sortedPlacements.filter(
    (placement) =>
      placement.side === 'left' && placement.turnNumber !== startPlacement.turnNumber,
  )
  const rightPlacements = sortedPlacements.filter(
    (placement) =>
      placement.side === 'right' && placement.turnNumber !== startPlacement.turnNumber,
  )
  const fallbackPlacements = sortedPlacements.filter(
    (placement) =>
      placement.side === 'start' && placement.turnNumber !== startPlacement.turnNumber,
  )

  return [
    toVisualPlacement(startPlacement, {
      x: 0,
      y: 0,
      orientation: startOrientation,
      rotation: getStartRotation(startPlacement),
      isStart: true,
      isLatest: startPlacement.turnNumber === latestTurnNumber,
    }),
    ...layoutEndpointChain({
      placements: leftPlacements,
      side: 'left',
      latestTurnNumber,
      initialEndpoint: {
        x: -startEndpointOffset,
        y: 0,
        direction: 'left',
        pip: startPlacement.leftValue,
        side: 'left',
        row: 0,
        runCount: 0,
        horizontalRunCount: 0,
        verticalRunCount: 0,
        horizontalDirection: 'left',
      },
    }),
    ...layoutEndpointChain({
      placements: [...rightPlacements, ...fallbackPlacements],
      side: 'right',
      latestTurnNumber,
      initialEndpoint: {
        x: startEndpointOffset,
        y: 0,
        direction: 'right',
        pip: startPlacement.rightValue,
        side: 'right',
        row: 0,
        runCount: 0,
        horizontalRunCount: 0,
        verticalRunCount: 0,
        horizontalDirection: 'right',
      },
    }),
  ].sort((first, second) => first.turnNumber - second.turnNumber)
}

function hasSavedVisualGeometry(placement: BoardPlacementDto) {
  return (
    typeof placement.x === 'number' &&
    typeof placement.y === 'number' &&
    typeof placement.rotation === 'number' &&
    (placement.orientation === 'horizontal' ||
      placement.orientation === 'vertical')
  )
}

function layoutEndpointChain({
  placements,
  side,
  latestTurnNumber,
  initialEndpoint,
}: {
  placements: BoardPlacementDto[]
  side: Exclude<BoardSide, 'start'>
  latestTurnNumber: number
  initialEndpoint: VisualEndpoint
}) {
  let endpoint = { ...initialEndpoint }

  return placements.map((placement) => {
    endpoint = turnEndpointIfNeeded(endpoint, placement)

    const connectedPip = getConnectedPip(placement, endpoint.pip, side)
    const exposedPip = getExposedPip(placement, connectedPip, side)
    const connectedTileSide = getConnectedTileSide(placement.tile, connectedPip)
    const orientation = getOrientationForDirection(
      endpoint.direction,
      placement.tile.isDouble,
    )
    const geometry = getPlacementGeometry(endpoint, placement.tile.isDouble)
    const visualPlacement = toVisualPlacement(placement, {
      x: geometry.center.x,
      y: geometry.center.y,
      orientation,
      rotation: getRotation({
        connectedPip,
        direction: endpoint.direction,
        orientation,
        placement,
      }),
      direction: endpoint.direction,
      isStart: false,
      isLatest: placement.turnNumber === latestTurnNumber,
      connectedPip,
      exposedPip,
      connectedTileSide,
    })

    endpoint = advanceVisualEndpoint(
      endpoint,
      geometry.nextEndpoint,
      exposedPip,
      placement.tile.isDouble,
    )

    return visualPlacement
  })
}

function turnEndpointIfNeeded(
  endpoint: VisualEndpoint,
  placement: BoardPlacementDto,
): VisualEndpoint {
  if (endpoint.pendingDirection && !placement.tile.isDouble) {
    return applyPendingDirection(endpoint)
  }

  if (endpoint.direction === 'up' || endpoint.direction === 'down') {
    if (shouldTurnFromVertical(endpoint, placement)) {
      const nextDirection = reverseHorizontalDirection(endpoint.horizontalDirection)

      return placement.tile.isDouble
        ? {
            ...endpoint,
            pendingDirection: nextDirection,
          }
        : {
            ...endpoint,
            direction: nextDirection,
            pendingDirection: undefined,
            horizontalRunCount: 0,
            verticalRunCount: 0,
          }
    }

    return endpoint
  }

  if (shouldTurnFromHorizontal(endpoint, placement)) {
    const nextDirection = getVerticalDirectionForSide(endpoint.side)

    return placement.tile.isDouble
      ? {
          ...endpoint,
          horizontalDirection: endpoint.direction,
          pendingDirection: nextDirection,
        }
      : {
          ...endpoint,
          direction: nextDirection,
          pendingDirection: undefined,
          horizontalDirection: endpoint.direction,
          horizontalRunCount: 0,
          verticalRunCount: 0,
        }
  }

  return endpoint
}

function applyPendingDirection(endpoint: VisualEndpoint): VisualEndpoint {
  const nextDirection = endpoint.pendingDirection!
  const isHorizontalDirection = nextDirection === 'left' || nextDirection === 'right'
  const adjustedEndpoint = endpoint.isDoubleEndpoint
    ? shiftPoint({ x: endpoint.x, y: endpoint.y }, nextDirection, PIP_CELL_SIZE / 2)
    : { x: endpoint.x, y: endpoint.y }

  return {
    ...endpoint,
    x: adjustedEndpoint.x,
    y: adjustedEndpoint.y,
    direction: nextDirection,
    pendingDirection: undefined,
    isDoubleEndpoint: false,
    horizontalDirection: isHorizontalDirection
      ? nextDirection
      : endpoint.horizontalDirection,
    horizontalRunCount: 0,
    verticalRunCount: 0,
    runCount: 0,
  }
}

function shouldTurnFromHorizontal(
  endpoint: VisualEndpoint,
  placement: BoardPlacementDto,
) {
  if (endpoint.horizontalRunCount >= HORIZONTAL_RUN_LENGTH) {
    return true
  }

  const geometry = getPlacementGeometry(endpoint, placement.tile.isDouble)

  return (
    (endpoint.direction === 'right' && geometry.nextEndpoint.x > MAX_X) ||
    (endpoint.direction === 'left' && geometry.nextEndpoint.x < MIN_X)
  )
}

function shouldTurnFromVertical(
  endpoint: VisualEndpoint,
  placement: BoardPlacementDto,
) {
  if (endpoint.verticalRunCount >= VERTICAL_RUN_LENGTH) {
    return true
  }

  const geometry = getPlacementGeometry(endpoint, placement.tile.isDouble)

  return (
    (endpoint.direction === 'down' && geometry.nextEndpoint.y > MAX_Y) ||
    (endpoint.direction === 'up' && geometry.nextEndpoint.y < MIN_Y)
  )
}

function getVerticalDirectionForSide(side: ChainSide): Extract<Direction, 'up' | 'down'> {
  return side === 'left' ? 'up' : 'down'
}

function advanceVisualEndpoint(
  endpoint: VisualEndpoint,
  nextEndpoint: Pick<VisualEndpoint, 'x' | 'y'>,
  exposedPip: number,
  isDoubleEndpoint: boolean,
): VisualEndpoint {
  if (endpoint.direction === 'up' || endpoint.direction === 'down') {
    return {
      ...endpoint,
      x: nextEndpoint.x,
      y: nextEndpoint.y,
      direction: endpoint.direction,
      pendingDirection: endpoint.pendingDirection,
      isDoubleEndpoint,
      pip: exposedPip,
      row: endpoint.row,
      runCount: endpoint.verticalRunCount + 1,
      horizontalRunCount: 0,
      verticalRunCount: endpoint.verticalRunCount + 1,
      lastTurnDirection: undefined,
    }
  }

  return {
    ...endpoint,
    x: nextEndpoint.x,
    y: nextEndpoint.y,
    direction: endpoint.direction,
    pendingDirection: endpoint.pendingDirection,
    isDoubleEndpoint,
    pip: exposedPip,
    runCount: endpoint.horizontalRunCount + 1,
    horizontalRunCount: endpoint.horizontalRunCount + 1,
    verticalRunCount: 0,
    horizontalDirection: endpoint.direction,
    lastTurnDirection: undefined,
  }
}

function shiftPoint(
  point: Pick<VisualEndpoint, 'x' | 'y'>,
  direction: Direction,
  distance: number,
) {
  if (direction === 'right') {
    return { x: point.x + distance, y: point.y }
  }

  if (direction === 'left') {
    return { x: point.x - distance, y: point.y }
  }

  if (direction === 'up') {
    return { x: point.x, y: point.y - distance }
  }

  return { x: point.x, y: point.y + distance }
}

function reverseHorizontalDirection(direction: HorizontalDirection) {
  return direction === 'right' ? 'left' : 'right'
}

function getPlacementGeometry(
  endpoint: VisualEndpoint,
  isDouble: boolean,
) {
  const offset = (isDouble ? PIP_CELL_SIZE : PIP_CELL_SIZE * 1.5) + CONNECTION_GAP
  const endpointAdvance = (isDouble ? PIP_CELL_SIZE : PIP_CELL_SIZE * 2) + CONNECTION_GAP

  if (endpoint.direction === 'right') {
    return {
      center: { x: endpoint.x + offset, y: endpoint.y },
      nextEndpoint: {
        x: endpoint.x + endpointAdvance,
        y: endpoint.y,
      },
    }
  }

  if (endpoint.direction === 'left') {
    return {
      center: { x: endpoint.x - offset, y: endpoint.y },
      nextEndpoint: {
        x: endpoint.x - endpointAdvance,
        y: endpoint.y,
      },
    }
  }

  if (endpoint.direction === 'up') {
    return {
      center: { x: endpoint.x, y: endpoint.y - offset },
      nextEndpoint: {
        x: endpoint.x,
        y: endpoint.y - endpointAdvance,
      },
    }
  }

  return {
    center: { x: endpoint.x, y: endpoint.y + offset },
    nextEndpoint: {
      x: endpoint.x,
      y: endpoint.y + endpointAdvance,
    },
  }
}

function getStartOrientation(placement: BoardPlacementDto): DominoOrientation {
  return placement.tile.isDouble ? 'vertical' : 'horizontal'
}

function getStartEndpointOffset(placement: BoardPlacementDto) {
  return placement.tile.isDouble ? 0 : PIP_CELL_SIZE / 2
}

function getStartRotation(placement: BoardPlacementDto) {
  if (placement.tile.isDouble) {
    return 0
  }

  return placement.tile.left === placement.leftValue &&
    placement.tile.right === placement.rightValue
    ? 270
    : 90
}

function getOrientationForDirection(
  direction: Direction,
  isDouble: boolean,
): DominoOrientation {
  const isHorizontalDirection = direction === 'left' || direction === 'right'
  const pathOrientation = isHorizontalDirection ? 'horizontal' : 'vertical'

  if (!isDouble) {
    return pathOrientation
  }

  return pathOrientation === 'horizontal' ? 'vertical' : 'horizontal'
}

function getConnectedPip(
  placement: BoardPlacementDto,
  endpointPip: number,
  side: Exclude<BoardSide, 'start'>,
) {
  if (placement.tile.left === endpointPip) {
    return placement.tile.left
  }

  if (placement.tile.right === endpointPip) {
    return placement.tile.right
  }

  return side === 'left' ? placement.rightValue : placement.leftValue
}

function getExposedPip(
  placement: BoardPlacementDto,
  connectedPip: number,
  side: Exclude<BoardSide, 'start'>,
) {
  if (placement.tile.left === connectedPip) {
    return placement.tile.right
  }

  if (placement.tile.right === connectedPip) {
    return placement.tile.left
  }

  return side === 'left' ? placement.leftValue : placement.rightValue
}

function getRotation({
  connectedPip,
  direction,
  orientation,
  placement,
}: {
  connectedPip: number
  direction: Direction
  orientation: DominoOrientation
  placement: BoardPlacementDto
}) {
  return getDominoRotationForConnection({
    tile: placement.tile,
    connectedPip,
    direction,
    orientation,
  })
}

export function getDominoRotationForConnection({
  tile,
  connectedPip,
  direction,
  orientation,
}: {
  tile: RotationTile
  connectedPip: number
  direction: Direction
  orientation: DominoOrientation
}) {
  // Asset convention: domino-low-high.png is normalized low-on-top and
  // high-on-bottom, so tile.left is the unrotated top and tile.right is the
  // unrotated bottom.
  if (tile.isDouble) {
    return orientation === 'horizontal' ? 90 : 0
  }

  const connectedTileSide = getConnectedTileSide(tile, connectedPip)

  if (connectedTileSide === 'left') {
    return getLeftPipConnectedRotation(direction)
  }

  if (connectedTileSide === 'right') {
    return getRightPipConnectedRotation(direction)
  }

  return getFallbackRotationForDirection(direction)
}

function getConnectedTileSide(tile: RotationTile, connectedPip: number) {
  if (tile.left === connectedPip) {
    return 'left'
  }

  if (tile.right === connectedPip) {
    return 'right'
  }

  return null
}

function getLeftPipConnectedRotation(direction: Direction) {
  if (direction === 'right') {
    return 270
  }

  if (direction === 'left') {
    return 90
  }

  if (direction === 'down') {
    return 0
  }

  return 180
}

function getRightPipConnectedRotation(direction: Direction) {
  if (direction === 'right') {
    return 90
  }

  if (direction === 'left') {
    return 270
  }

  if (direction === 'down') {
    return 180
  }

  return 0
}

function getFallbackRotationForDirection(direction: Direction) {
  if (direction === 'left') {
    return 270
  }

  if (direction === 'up') {
    return 180
  }

  return direction === 'right' ? 90 : 0
}

function toVisualPlacement(
  placement: BoardPlacementDto,
  layout: {
    x: number
    y: number
    rotation: number
    orientation: DominoOrientation
    isStart: boolean
    isLatest: boolean
    direction?: Direction
    connectedPip?: number | null
    exposedPip?: number | null
    connectedTileSide?: 'left' | 'right' | null
  },
): VisualDominoPlacement {
  return {
    tileId: placement.tile.id,
    x: layout.x,
    y: layout.y,
    rotation: layout.rotation,
    orientation: layout.orientation,
    isDouble: placement.tile.isDouble,
    isStart: layout.isStart,
    isLatest: layout.isLatest,
    turnNumber: placement.turnNumber,
    playedBy: placement.playedBy,
    side: placement.side,
    direction: layout.direction ?? placement.direction,
    connectedPip: layout.connectedPip,
    exposedPip: layout.exposedPip,
    connectedTileSide: layout.connectedTileSide ?? placement.connectedTileSide,
  }
}
