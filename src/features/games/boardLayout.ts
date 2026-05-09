import { type BoardPlacementDto, type BoardSide } from './types'

type Direction = 'right' | 'left' | 'up' | 'down'
type DominoOrientation = 'horizontal' | 'vertical'
type ChainSide = Exclude<BoardSide, 'start'>
type HorizontalDirection = Extract<Direction, 'left' | 'right'>

type VisualEndpoint = {
  x: number
  y: number
  direction: Direction
  pip: number
  side: ChainSide
  row: number
  runCount: number
  horizontalRunCount: number
  verticalRunCount: number
  horizontalDirection: HorizontalDirection
  lastTurnDirection?: HorizontalDirection
  previousDirection?: Direction
  pendingDirection?: Direction
  turnFromDouble?: boolean
  isDoubleEndpoint?: boolean
  doubleOrientation?: DominoOrientation
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
  const startRotation = getStartRotation(startPlacement)
  const leftStartAnchor = getStartEndpointAnchor(
    startPlacement,
    'left',
    startOrientation,
    startRotation,
  )
  const rightStartAnchor = getStartEndpointAnchor(
    startPlacement,
    'right',
    startOrientation,
    startRotation,
  )
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
      rotation: startRotation,
      isStart: true,
      isLatest: startPlacement.turnNumber === latestTurnNumber,
    }),
    ...layoutEndpointChain({
      placements: leftPlacements,
      side: 'left',
      latestTurnNumber,
      initialEndpoint: {
        x: leftStartAnchor.x,
        y: leftStartAnchor.y,
        direction: 'left',
        pip: startPlacement.leftValue,
        side: 'left',
        row: 0,
        runCount: 0,
        horizontalRunCount: 0,
        verticalRunCount: 0,
        horizontalDirection: 'left',
        isDoubleEndpoint: leftStartAnchor.isDoubleEndpoint,
        doubleOrientation: leftStartAnchor.doubleOrientation,
      },
    }),
    ...layoutEndpointChain({
      placements: [...rightPlacements, ...fallbackPlacements],
      side: 'right',
      latestTurnNumber,
      initialEndpoint: {
        x: rightStartAnchor.x,
        y: rightStartAnchor.y,
        direction: 'right',
        pip: startPlacement.rightValue,
        side: 'right',
        row: 0,
        runCount: 0,
        horizontalRunCount: 0,
        verticalRunCount: 0,
        horizontalDirection: 'right',
        isDoubleEndpoint: rightStartAnchor.isDoubleEndpoint,
        doubleOrientation: rightStartAnchor.doubleOrientation,
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
    const rotation = getRotation({
      connectedPip,
      direction: endpoint.direction,
      orientation,
      placement,
    })
    const geometry = getPlacementGeometry({
      endpoint,
      orientation,
      rotation,
      connectedTileSide,
      isDouble: placement.tile.isDouble,
    })
    const visualPlacement = toVisualPlacement(placement, {
      x: geometry.center.x,
      y: geometry.center.y,
      orientation,
      rotation,
      direction: endpoint.direction,
      isStart: false,
      isLatest: placement.turnNumber === latestTurnNumber,
      connectedPip,
      exposedPip,
      connectedTileSide,
    })

    endpoint = advanceVisualEndpoint({
      endpoint,
      nextEndpoint: geometry.nextEndpoint,
      exposedPip,
      isDouble: placement.tile.isDouble,
      orientation,
    })

    return visualPlacement
  })
}

function turnEndpointIfNeeded(
  endpoint: VisualEndpoint,
  placement: BoardPlacementDto,
): VisualEndpoint {
  if (endpoint.pendingDirection) {
    return applyPendingTurn(endpoint)
  }

  if (endpoint.direction === 'up' || endpoint.direction === 'down') {
    if (shouldTurnFromVertical(endpoint, placement)) {
      const nextDirection = reverseHorizontalDirection(endpoint.horizontalDirection)

      if (placement.tile.isDouble) {
        return deferTurnUntilAfterDouble(endpoint, nextDirection)
      }

      return {
        ...endpoint,
        previousDirection: endpoint.direction,
        direction: nextDirection,
        horizontalDirection: nextDirection,
        horizontalRunCount: 0,
        verticalRunCount: 0,
      }
    }

    return endpoint
  }

  if (shouldTurnFromHorizontal(endpoint, placement)) {
    const nextDirection = getVerticalDirectionForSide(endpoint.side)

    if (placement.tile.isDouble) {
      return deferTurnUntilAfterDouble(endpoint, nextDirection)
    }

    return {
      ...endpoint,
      previousDirection: endpoint.direction,
      direction: nextDirection,
      horizontalDirection: endpoint.direction,
      horizontalRunCount: 0,
      verticalRunCount: 0,
    }
  }

  return endpoint
}

function applyPendingTurn(endpoint: VisualEndpoint): VisualEndpoint {
  const pendingDirection = endpoint.pendingDirection!
  const nextHorizontalDirection =
    pendingDirection === 'left' || pendingDirection === 'right'
      ? pendingDirection
      : endpoint.direction === 'left' || endpoint.direction === 'right'
        ? endpoint.direction
        : endpoint.horizontalDirection

  return {
    ...endpoint,
    previousDirection: endpoint.direction,
    direction: pendingDirection,
    pendingDirection: undefined,
    turnFromDouble: true,
    horizontalDirection: nextHorizontalDirection,
    horizontalRunCount: 0,
    verticalRunCount: 0,
  }
}

function deferTurnUntilAfterDouble(
  endpoint: VisualEndpoint,
  pendingDirection: Direction,
): VisualEndpoint {
  return {
    ...endpoint,
    previousDirection: undefined,
    pendingDirection,
    turnFromDouble: undefined,
  }
}

function shouldTurnFromHorizontal(
  endpoint: VisualEndpoint,
  placement: BoardPlacementDto,
) {
  if (endpoint.horizontalRunCount >= HORIZONTAL_RUN_LENGTH) {
    return true
  }

  const orientation = getOrientationForDirection(
    endpoint.direction,
    placement.tile.isDouble,
  )
  const geometry = getProjectedPlacementGeometry(endpoint, placement, orientation)

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

  const orientation = getOrientationForDirection(
    endpoint.direction,
    placement.tile.isDouble,
  )
  const geometry = getProjectedPlacementGeometry(endpoint, placement, orientation)

  return (
    (endpoint.direction === 'down' && geometry.nextEndpoint.y > MAX_Y) ||
    (endpoint.direction === 'up' && geometry.nextEndpoint.y < MIN_Y)
  )
}

function getVerticalDirectionForSide(side: ChainSide): Extract<Direction, 'up' | 'down'> {
  return side === 'left' ? 'up' : 'down'
}

function advanceVisualEndpoint({
  endpoint,
  nextEndpoint,
  exposedPip,
  isDouble,
  orientation,
}: {
  endpoint: VisualEndpoint
  nextEndpoint: Pick<VisualEndpoint, 'x' | 'y'>
  exposedPip: number
  isDouble: boolean
  orientation: DominoOrientation
}): VisualEndpoint {
  const doubleEndpointState = isDouble
    ? {
        isDoubleEndpoint: true,
        doubleOrientation: orientation,
      }
    : {
        isDoubleEndpoint: undefined,
        doubleOrientation: undefined,
      }

  if (endpoint.direction === 'up' || endpoint.direction === 'down') {
    return {
      ...endpoint,
      ...doubleEndpointState,
      x: nextEndpoint.x,
      y: nextEndpoint.y,
      direction: endpoint.direction,
      pip: exposedPip,
      row: endpoint.row,
      runCount: endpoint.verticalRunCount + 1,
      horizontalRunCount: 0,
      verticalRunCount: endpoint.verticalRunCount + 1,
      lastTurnDirection: undefined,
      previousDirection: undefined,
      turnFromDouble: undefined,
    }
  }

  return {
    ...endpoint,
    ...doubleEndpointState,
    x: nextEndpoint.x,
    y: nextEndpoint.y,
    direction: endpoint.direction,
    pip: exposedPip,
    runCount: endpoint.horizontalRunCount + 1,
    horizontalRunCount: endpoint.horizontalRunCount + 1,
    verticalRunCount: 0,
    horizontalDirection: endpoint.direction,
    lastTurnDirection: undefined,
    previousDirection: undefined,
    turnFromDouble: undefined,
  }
}

function reverseHorizontalDirection(direction: HorizontalDirection) {
  return direction === 'right' ? 'left' : 'right'
}

function getProjectedPlacementGeometry(
  endpoint: VisualEndpoint,
  placement: BoardPlacementDto,
  orientation = getOrientationForDirection(endpoint.direction, placement.tile.isDouble),
) {
  const connectedPip = getConnectedPip(placement, endpoint.pip, endpoint.side)
  const connectedTileSide = getConnectedTileSide(placement.tile, connectedPip)
  const rotation = getRotation({
    connectedPip,
    direction: endpoint.direction,
    orientation,
    placement,
  })

  return getPlacementGeometry({
    endpoint,
    orientation,
    rotation,
    connectedTileSide,
    isDouble: placement.tile.isDouble,
  })
}

function getPlacementGeometry({
  endpoint,
  rotation,
  connectedTileSide,
  isDouble,
}: {
  endpoint: VisualEndpoint
  orientation: DominoOrientation
  rotation: number
  connectedTileSide: 'left' | 'right' | null
  isDouble: boolean
}) {
  const origin = getConnectionOrigin(endpoint)

  if (isDouble) {
    const center = addVector(origin, directionVector(endpoint.direction, REGULAR_SHORT))

    return {
      center,
      nextEndpoint: center,
    }
  }

  const connectedCellCenter = addVector(
    origin,
    directionVector(endpoint.direction, REGULAR_SHORT),
  )
  const safeConnectedTileSide = connectedTileSide ?? 'left'
  const connectedOffset = getPipOffset(safeConnectedTileSide, rotation)
  const exposedOffset = getPipOffset(
    safeConnectedTileSide === 'left' ? 'right' : 'left',
    rotation,
  )
  const center = {
    x: connectedCellCenter.x - connectedOffset.x,
    y: connectedCellCenter.y - connectedOffset.y,
  }

  return {
    center,
    nextEndpoint: addVector(center, exposedOffset),
  }
}

function getConnectionOrigin(endpoint: VisualEndpoint) {
  if (
    endpoint.isDoubleEndpoint &&
    endpoint.doubleOrientation &&
    directionMatchesOrientation(endpoint.direction, endpoint.doubleOrientation)
  ) {
    return addVector(
      endpoint,
      directionVector(endpoint.direction, REGULAR_SHORT / 2),
    )
  }

  return {
    x: endpoint.x,
    y: endpoint.y,
  }
}

function addVector(
  point: { x: number; y: number },
  vector: { x: number; y: number },
) {
  return {
    x: point.x + vector.x,
    y: point.y + vector.y,
  }
}

function directionVector(direction: Direction, amount: number) {
  if (direction === 'right') {
    return { x: amount, y: 0 }
  }

  if (direction === 'left') {
    return { x: -amount, y: 0 }
  }

  if (direction === 'up') {
    return { x: 0, y: -amount }
  }

  return { x: 0, y: amount }
}

function directionMatchesOrientation(
  direction: Direction,
  orientation: DominoOrientation,
) {
  const isHorizontalDirection = direction === 'left' || direction === 'right'

  return isHorizontalDirection
    ? orientation === 'horizontal'
    : orientation === 'vertical'
}

function getPipOffset(side: 'left' | 'right', rotation: number) {
  const baseVector =
    side === 'left'
      ? { x: 0, y: -REGULAR_SHORT / 2 }
      : { x: 0, y: REGULAR_SHORT / 2 }
  const radians = (rotation * Math.PI) / 180

  return {
    x: Math.round(
      baseVector.x * Math.cos(radians) - baseVector.y * Math.sin(radians),
    ),
    y: Math.round(
      baseVector.x * Math.sin(radians) + baseVector.y * Math.cos(radians),
    ),
  }
}

function getStartOrientation(placement: BoardPlacementDto): DominoOrientation {
  return placement.tile.isDouble ? 'vertical' : 'horizontal'
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

function getStartEndpointAnchor(
  placement: BoardPlacementDto,
  side: ChainSide,
  orientation: DominoOrientation,
  rotation: number,
) {
  if (placement.tile.isDouble) {
    return {
      x: 0,
      y: 0,
      isDoubleEndpoint: true,
      doubleOrientation: orientation,
    }
  }

  const openPip = side === 'left' ? placement.leftValue : placement.rightValue
  const tileSide = getConnectedTileSide(placement.tile, openPip) ?? side
  const offset = getPipOffset(tileSide, rotation)

  return {
    x: offset.x,
    y: offset.y,
    isDoubleEndpoint: undefined,
    doubleOrientation: undefined,
  }
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
