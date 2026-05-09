import { describe, expect, it } from 'vitest'
import {
  createDominoBoardLayout,
  getDominoRotationForConnection,
} from '../boardLayout'
import { type BoardPlacementDto } from '../types'

const placement = ({
  turnNumber,
  id,
  side = turnNumber === 1 ? 'start' : 'right',
  leftValue,
  rightValue,
  visual,
}: {
  turnNumber: number
  id: string
  side?: BoardPlacementDto['side']
  leftValue?: number
  rightValue?: number
  visual?: Partial<BoardPlacementDto>
}): BoardPlacementDto => {
  const [left, right] = id.split('-').map(Number)

  return {
    tile: {
      id,
      left,
      right,
      isDouble: left === right,
      pipTotal: left + right,
    },
    playedBy: 'player-a',
    side,
    leftValue: leftValue ?? left,
    rightValue: rightValue ?? right,
    turnNumber,
    ...visual,
  }
}

const TILE_LONG = 56
const TILE_SHORT = 28

function visualBounds(
  visual: ReturnType<typeof createDominoBoardLayout>[number],
) {
  const width = visual.orientation === 'horizontal' ? TILE_LONG : TILE_SHORT
  const height = visual.orientation === 'horizontal' ? TILE_SHORT : TILE_LONG

  return {
    left: visual.x - width / 2,
    right: visual.x + width / 2,
    top: visual.y - height / 2,
    bottom: visual.y + height / 2,
  }
}

function overlapArea(
  first: ReturnType<typeof createDominoBoardLayout>[number],
  second: ReturnType<typeof createDominoBoardLayout>[number],
) {
  const firstBounds = visualBounds(first)
  const secondBounds = visualBounds(second)
  const overlapWidth = Math.max(
    0,
    Math.min(firstBounds.right, secondBounds.right) -
      Math.max(firstBounds.left, secondBounds.left),
  )
  const overlapHeight = Math.max(
    0,
    Math.min(firstBounds.bottom, secondBounds.bottom) -
      Math.max(firstBounds.top, secondBounds.top),
  )

  return overlapWidth * overlapHeight
}

function rotateVector(vector: { x: number; y: number }, rotation: number) {
  const radians = (rotation * Math.PI) / 180

  return {
    x: Math.round(vector.x * Math.cos(radians) - vector.y * Math.sin(radians)),
    y: Math.round(vector.x * Math.sin(radians) + vector.y * Math.cos(radians)),
  }
}

function pipAnchor(
  visual: ReturnType<typeof createDominoBoardLayout>[number],
  side: 'left' | 'right' | 'doubleCenter' = 'doubleCenter',
) {
  if (side === 'doubleCenter') {
    return { x: visual.x, y: visual.y }
  }

  const baseVector =
    side === 'left'
      ? { x: 0, y: -TILE_SHORT / 2 }
      : { x: 0, y: TILE_SHORT / 2 }
  const rotatedVector = rotateVector(baseVector, visual.rotation)

  return {
    x: visual.x + rotatedVector.x,
    y: visual.y + rotatedVector.y,
  }
}

function connectedAnchor(
  visual: ReturnType<typeof createDominoBoardLayout>[number],
) {
  if (visual.isDouble) {
    return pipAnchor(visual)
  }

  return pipAnchor(visual, visual.connectedTileSide ?? 'left')
}

function exposedAnchor(
  visual: ReturnType<typeof createDominoBoardLayout>[number],
) {
  if (visual.isDouble) {
    return pipAnchor(visual)
  }

  return pipAnchor(
    visual,
    visual.connectedTileSide === 'left' ? 'right' : 'left',
  )
}

function anchorDistance(
  first: { x: number; y: number },
  second: { x: number; y: number },
) {
  return Math.hypot(first.x - second.x, first.y - second.y)
}

function directionVector(
  direction: NonNullable<
    ReturnType<typeof createDominoBoardLayout>[number]['direction']
  >,
  amount: number,
) {
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
  direction: NonNullable<
    ReturnType<typeof createDominoBoardLayout>[number]['direction']
  >,
  orientation: ReturnType<typeof createDominoBoardLayout>[number]['orientation'],
) {
  const isHorizontalDirection = direction === 'left' || direction === 'right'

  return isHorizontalDirection
    ? orientation === 'horizontal'
    : orientation === 'vertical'
}

function exposedAnchorForConnection(
  previous: ReturnType<typeof createDominoBoardLayout>[number],
  next: ReturnType<typeof createDominoBoardLayout>[number],
) {
  if (!previous.isDouble || !next.direction) {
    return exposedAnchor(previous)
  }

  if (directionMatchesOrientation(next.direction, previous.orientation)) {
    const offset = directionVector(next.direction, TILE_SHORT / 2)

    return {
      x: previous.x + offset.x,
      y: previous.y + offset.y,
    }
  }

  return pipAnchor(previous)
}

function expectAnchorsTouch(
  previous: ReturnType<typeof createDominoBoardLayout>[number],
  next: ReturnType<typeof createDominoBoardLayout>[number],
) {
  expect(
    anchorDistance(exposedAnchorForConnection(previous, next), connectedAnchor(next)),
  ).toBe(TILE_SHORT)
}

describe('boardLayout', () => {
  it('does not crash on empty placements', () => {
    expect(createDominoBoardLayout([])).toEqual([])
  })

  it('returns one visual placement for each board placement', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '1-2', side: 'start' }),
      placement({ turnNumber: 2, id: '2-3', side: 'right' }),
    ])

    expect(layout).toHaveLength(2)
    expect(layout[0]).toMatchObject({ tileId: '1-2', turnNumber: 1 })
  })

  it('uses saved server geometry when every placement includes it', () => {
    const layout = createDominoBoardLayout([
      placement({
        turnNumber: 1,
        id: '1-2',
        side: 'start',
        visual: {
          x: 0,
          y: 0,
          rotation: 90,
          orientation: 'horizontal',
          direction: 'right',
          connectedPip: null,
          exposedPip: 2,
        },
      }),
      placement({
        turnNumber: 2,
        id: '2-3',
        side: 'right',
        visual: {
          x: 57,
          y: 0,
          rotation: 270,
          orientation: 'horizontal',
          direction: 'right',
          connectedPip: 2,
          exposedPip: 3,
        },
      }),
      placement({
        turnNumber: 3,
        id: '0-1',
        side: 'left',
        visual: {
          x: -57,
          y: 0,
          rotation: 90,
          orientation: 'horizontal',
          direction: 'left',
          connectedPip: 1,
          exposedPip: 0,
        },
      }),
    ])

    expect(layout).toEqual([
      expect.objectContaining({
        tileId: '1-2',
        x: 0,
        y: 0,
        rotation: 90,
        orientation: 'horizontal',
        isStart: true,
        isLatest: false,
        connectedPip: null,
        exposedPip: 2,
      }),
      expect.objectContaining({
        tileId: '2-3',
        x: 57,
        y: 0,
        rotation: 270,
        orientation: 'horizontal',
        isLatest: false,
        connectedPip: 2,
        exposedPip: 3,
      }),
      expect.objectContaining({
        tileId: '0-1',
        x: -57,
        y: 0,
        rotation: 90,
        orientation: 'horizontal',
        isLatest: true,
        connectedPip: 1,
        exposedPip: 0,
      }),
    ])
  })

  it('falls back to endpoint geometry for old placements without saved geometry', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '1-2', side: 'start' }),
      placement({ turnNumber: 2, id: '2-3', side: 'right' }),
      placement({ turnNumber: 3, id: '0-1', side: 'left' }),
    ])

    expect(layout).toEqual([
      expect.objectContaining({
        tileId: '1-2',
        x: 0,
        y: 0,
        isStart: true,
        orientation: 'horizontal',
        rotation: 270,
      }),
      expect.objectContaining({
        tileId: '2-3',
        x: 56,
        y: 0,
        connectedPip: 2,
        exposedPip: 3,
      }),
      expect.objectContaining({
        tileId: '0-1',
        x: -56,
        y: 0,
        connectedPip: 1,
        exposedPip: 0,
      }),
    ])
  })

  it('connects the first left and right fallback tiles edge-to-edge with a start double', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '5-6', side: 'right' }),
      placement({ turnNumber: 3, id: '4-6', side: 'left' }),
    ])

    expect(layout[0]).toMatchObject({
      tileId: '6-6',
      x: 0,
      y: 0,
      orientation: 'vertical',
      isStart: true,
    })
    expect(layout[1]).toMatchObject({
      tileId: '5-6',
      x: 42,
      y: 0,
      orientation: 'horizontal',
      connectedPip: 6,
      exposedPip: 5,
    })
    expect(layout[2]).toMatchObject({
      tileId: '4-6',
      x: -42,
      y: 0,
      orientation: 'horizontal',
      connectedPip: 6,
      exposedPip: 4,
    })
  })

  it('aligns matching pip cells on straight regular connections', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '5-5', side: 'start' }),
      placement({ turnNumber: 2, id: '5-6', side: 'right' }),
      placement({ turnNumber: 3, id: '4-6', side: 'right' }),
    ])
    const fiveSix = layout.find((visual) => visual.turnNumber === 2)!
    const fourSix = layout.find((visual) => visual.turnNumber === 3)!

    expect(fiveSix).toMatchObject({
      tileId: '5-6',
      connectedPip: 5,
      exposedPip: 6,
    })
    expect(fourSix).toMatchObject({
      tileId: '4-6',
      connectedPip: 6,
      exposedPip: 4,
    })
    expectAnchorsTouch(fiveSix, fourSix)
    expect(exposedAnchor(fiveSix).y).toBe(connectedAnchor(fourSix).y)
  })

  it('aligns matching pip cells through a normal corner turn', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '0-6', side: 'right' }),
      placement({ turnNumber: 3, id: '0-1', side: 'right' }),
      placement({ turnNumber: 4, id: '1-2', side: 'right' }),
      placement({ turnNumber: 5, id: '2-3', side: 'right' }),
      placement({ turnNumber: 6, id: '3-4', side: 'right' }),
    ])
    const turnIn = layout.find((visual) => visual.turnNumber === 5)!
    const turnOut = layout.find((visual) => visual.turnNumber === 6)!

    expect(turnOut).toMatchObject({
      direction: 'down',
      connectedPip: 3,
      exposedPip: 4,
    })
    expectAnchorsTouch(turnIn, turnOut)
    expect(exposedAnchor(turnIn).x).toBe(connectedAnchor(turnOut).x)
  })

  it('advances fallback endpoints from exposed tile edges without a connection gap', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '1-2', side: 'start' }),
      placement({ turnNumber: 2, id: '2-3', side: 'right' }),
      placement({ turnNumber: 3, id: '3-4', side: 'right' }),
      placement({ turnNumber: 4, id: '0-1', side: 'left' }),
      placement({ turnNumber: 5, id: '0-5', side: 'left' }),
    ])

    expect(layout[1]).toMatchObject({ tileId: '2-3', x: 56 })
    expect(layout[2]).toMatchObject({ tileId: '3-4', x: 112 })
    expect(layout[3]).toMatchObject({ tileId: '0-1', x: -56 })
    expect(layout[4]).toMatchObject({ tileId: '0-5', x: -112 })
  })

  it('keeps fallback doubles crosswise while attached to the current endpoint', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '1-2', side: 'start' }),
      placement({ turnNumber: 2, id: '2-3', side: 'right' }),
      placement({ turnNumber: 3, id: '3-3', side: 'right' }),
    ])

    expect(layout[2]).toMatchObject({
      tileId: '3-3',
      x: 98,
      y: 0,
      orientation: 'vertical',
      connectedPip: 3,
      exposedPip: 3,
    })
  })

  it('continues a right chain from the outer edge of an end double', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '1-2', side: 'start' }),
      placement({ turnNumber: 2, id: '2-3', side: 'right' }),
      placement({ turnNumber: 3, id: '3-3', side: 'right' }),
      placement({ turnNumber: 4, id: '3-4', side: 'right' }),
    ])

    expect(layout[2]).toMatchObject({
      tileId: '3-3',
      x: 98,
      y: 0,
      direction: 'right',
      orientation: 'vertical',
    })
    expect(layout[3]).toMatchObject({
      tileId: '3-4',
      x: 140,
      y: 0,
      direction: 'right',
      orientation: 'horizontal',
    })
  })

  it('continues a left chain from the outer edge of an end double', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '1-2', side: 'start' }),
      placement({ turnNumber: 2, id: '0-1', side: 'left' }),
      placement({ turnNumber: 3, id: '0-0', side: 'left' }),
      placement({ turnNumber: 4, id: '0-5', side: 'left' }),
    ])

    expect(layout[2]).toMatchObject({
      tileId: '0-0',
      x: -98,
      y: 0,
      direction: 'left',
      orientation: 'vertical',
    })
    expect(layout[3]).toMatchObject({
      tileId: '0-5',
      x: -140,
      y: 0,
      direction: 'left',
      orientation: 'horizontal',
    })
  })

  it('runs the right chain right, down for two placements, then left', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '0-6', side: 'right' }),
      placement({ turnNumber: 3, id: '0-1', side: 'right' }),
      placement({ turnNumber: 4, id: '1-2', side: 'right' }),
      placement({ turnNumber: 5, id: '2-3', side: 'right' }),
      placement({ turnNumber: 6, id: '3-4', side: 'right' }),
      placement({ turnNumber: 7, id: '4-5', side: 'right' }),
      placement({ turnNumber: 8, id: '5-6', side: 'right' }),
    ])

    expect(layout.find((visual) => visual.turnNumber === 2)).toMatchObject({
      direction: 'right',
      x: 42,
      y: 0,
    })
    expect(layout.find((visual) => visual.turnNumber === 5)).toMatchObject({
      direction: 'right',
      x: 210,
      y: 0,
    })
    expect(layout.find((visual) => visual.turnNumber === 6)).toMatchObject({
      direction: 'down',
      x: 224,
      y: 42,
    })
    expect(layout.find((visual) => visual.turnNumber === 7)).toMatchObject({
      direction: 'down',
      x: 224,
      y: 98,
    })
    expect(layout.find((visual) => visual.turnNumber === 8)).toMatchObject({
      direction: 'left',
      x: 182,
      y: 112,
    })
  })

  it('runs the left chain left, up for two placements, then right', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '5-6', side: 'left' }),
      placement({ turnNumber: 3, id: '4-5', side: 'left' }),
      placement({ turnNumber: 4, id: '3-4', side: 'left' }),
      placement({ turnNumber: 5, id: '2-3', side: 'left' }),
      placement({ turnNumber: 6, id: '1-2', side: 'left' }),
      placement({ turnNumber: 7, id: '0-1', side: 'left' }),
      placement({ turnNumber: 8, id: '0-6', side: 'left' }),
    ])

    expect(layout.find((visual) => visual.turnNumber === 2)).toMatchObject({
      direction: 'left',
      x: -42,
      y: 0,
    })
    expect(layout.find((visual) => visual.turnNumber === 5)).toMatchObject({
      direction: 'left',
      x: -210,
      y: 0,
    })
    expect(layout.find((visual) => visual.turnNumber === 6)).toMatchObject({
      direction: 'up',
      x: -224,
      y: -42,
    })
    expect(layout.find((visual) => visual.turnNumber === 7)).toMatchObject({
      direction: 'up',
      x: -224,
      y: -98,
    })
    expect(layout.find((visual) => visual.turnNumber === 8)).toMatchObject({
      direction: 'right',
      x: -182,
      y: -112,
    })
  })

  it('keeps right-side turn placements touching without rectangle overlap', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '0-6', side: 'right' }),
      placement({ turnNumber: 3, id: '0-1', side: 'right' }),
      placement({ turnNumber: 4, id: '1-2', side: 'right' }),
      placement({ turnNumber: 5, id: '2-3', side: 'right' }),
      placement({ turnNumber: 6, id: '3-4', side: 'right' }),
      placement({ turnNumber: 7, id: '4-5', side: 'right' }),
      placement({ turnNumber: 8, id: '5-6', side: 'right' }),
    ])
    const turnIn = layout.find((visual) => visual.turnNumber === 5)!
    const firstVertical = layout.find((visual) => visual.turnNumber === 6)!
    const secondVertical = layout.find((visual) => visual.turnNumber === 7)!
    const turnOut = layout.find((visual) => visual.turnNumber === 8)!

    expect(overlapArea(turnIn, firstVertical)).toBe(0)
    expect(overlapArea(firstVertical, secondVertical)).toBe(0)
    expect(overlapArea(secondVertical, turnOut)).toBe(0)
  })

  it('defers a planned right-side turn until after a double is placed', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '0-6', side: 'right' }),
      placement({ turnNumber: 3, id: '0-1', side: 'right' }),
      placement({ turnNumber: 4, id: '1-2', side: 'right' }),
      placement({ turnNumber: 5, id: '2-3', side: 'right' }),
      placement({ turnNumber: 6, id: '3-3', side: 'right' }),
      placement({ turnNumber: 7, id: '3-4', side: 'right' }),
    ])
    const turnIn = layout.find((visual) => visual.turnNumber === 5)!
    const doubleAtTurn = layout.find((visual) => visual.turnNumber === 6)!
    const nextTile = layout.find((visual) => visual.turnNumber === 7)!

    expect(doubleAtTurn).toMatchObject({
      direction: 'right',
      orientation: 'vertical',
      rotation: 0,
    })
    expect(nextTile).toMatchObject({
      direction: 'down',
      orientation: 'vertical',
      rotation: 0,
      connectedPip: 3,
    })
    expect(overlapArea(turnIn, doubleAtTurn)).toBe(0)
    expect(overlapArea(doubleAtTurn, nextTile)).toBe(0)
  })

  it('keeps the 0 side adjacent when a 0-0 double reaches the right turn', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '0-6', side: 'right' }),
      placement({ turnNumber: 3, id: '0-1', side: 'right' }),
      placement({ turnNumber: 4, id: '1-2', side: 'right' }),
      placement({ turnNumber: 5, id: '0-2', side: 'right' }),
      placement({ turnNumber: 6, id: '0-0', side: 'right' }),
      placement({ turnNumber: 7, id: '0-6', side: 'right' }),
    ])
    const doubleAtTurn = layout.find((visual) => visual.turnNumber === 6)!
    const nextTile = layout.find((visual) => visual.turnNumber === 7)!

    expect(doubleAtTurn).toMatchObject({
      tileId: '0-0',
      direction: 'right',
      orientation: 'vertical',
      connectedPip: 0,
      exposedPip: 0,
    })
    expect(nextTile).toMatchObject({
      tileId: '0-6',
      direction: 'down',
      orientation: 'vertical',
      rotation: 0,
      connectedPip: 0,
      exposedPip: 6,
    })
    expectAnchorsTouch(doubleAtTurn, nextTile)
    expect(pipAnchor(doubleAtTurn).x).toBe(connectedAnchor(nextTile).x)
    expect(overlapArea(doubleAtTurn, nextTile)).toBe(0)
  })

  it('aligns the next tile from the center anchor of a deferred 2-2 double turn', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '5-6', side: 'left' }),
      placement({ turnNumber: 3, id: '4-5', side: 'left' }),
      placement({ turnNumber: 4, id: '3-4', side: 'left' }),
      placement({ turnNumber: 5, id: '2-3', side: 'left' }),
      placement({ turnNumber: 6, id: '2-2', side: 'left' }),
      placement({ turnNumber: 7, id: '2-4', side: 'left' }),
    ])
    const doubleAtTurn = layout.find((visual) => visual.turnNumber === 6)!
    const nextTile = layout.find((visual) => visual.turnNumber === 7)!

    expect(doubleAtTurn).toMatchObject({
      tileId: '2-2',
      direction: 'left',
      orientation: 'vertical',
      connectedPip: 2,
      exposedPip: 2,
    })
    expect(nextTile).toMatchObject({
      tileId: '2-4',
      direction: 'up',
      connectedPip: 2,
      exposedPip: 4,
    })
    expectAnchorsTouch(doubleAtTurn, nextTile)
    expect(pipAnchor(doubleAtTurn).x).toBe(connectedAnchor(nextTile).x)
    expect(overlapArea(doubleAtTurn, nextTile)).toBe(0)
  })

  it('keeps the next matching pip aligned after the tile following a deferred double turn', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '0-6', side: 'right' }),
      placement({ turnNumber: 3, id: '0-1', side: 'right' }),
      placement({ turnNumber: 4, id: '1-2', side: 'right' }),
      placement({ turnNumber: 5, id: '2-3', side: 'right' }),
      placement({ turnNumber: 6, id: '3-3', side: 'right' }),
      placement({ turnNumber: 7, id: '3-4', side: 'right' }),
      placement({ turnNumber: 8, id: '4-5', side: 'right' }),
    ])
    const firstAfterDouble = layout.find((visual) => visual.turnNumber === 7)!
    const secondAfterDouble = layout.find((visual) => visual.turnNumber === 8)!

    expect(firstAfterDouble).toMatchObject({
      tileId: '3-4',
      direction: 'down',
      rotation: 0,
      connectedPip: 3,
      exposedPip: 4,
    })
    expect(secondAfterDouble).toMatchObject({
      tileId: '4-5',
      direction: 'down',
      rotation: 0,
      connectedPip: 4,
      exposedPip: 5,
    })
    expectAnchorsTouch(firstAfterDouble, secondAfterDouble)
    expect(exposedAnchor(firstAfterDouble).x).toBe(
      connectedAnchor(secondAfterDouble).x,
    )
    expect(overlapArea(firstAfterDouble, secondAfterDouble)).toBe(0)
  })

  it('keeps left-side turn placements touching without rectangle overlap', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '5-6', side: 'left' }),
      placement({ turnNumber: 3, id: '4-5', side: 'left' }),
      placement({ turnNumber: 4, id: '3-4', side: 'left' }),
      placement({ turnNumber: 5, id: '2-3', side: 'left' }),
      placement({ turnNumber: 6, id: '1-2', side: 'left' }),
      placement({ turnNumber: 7, id: '0-1', side: 'left' }),
      placement({ turnNumber: 8, id: '0-6', side: 'left' }),
    ])
    const turnIn = layout.find((visual) => visual.turnNumber === 5)!
    const firstVertical = layout.find((visual) => visual.turnNumber === 6)!
    const secondVertical = layout.find((visual) => visual.turnNumber === 7)!
    const turnOut = layout.find((visual) => visual.turnNumber === 8)!

    expect(overlapArea(turnIn, firstVertical)).toBe(0)
    expect(overlapArea(firstVertical, secondVertical)).toBe(0)
    expect(overlapArea(secondVertical, turnOut)).toBe(0)
  })

  it('defers a planned left-side turn until after a double is placed', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '5-6', side: 'left' }),
      placement({ turnNumber: 3, id: '4-5', side: 'left' }),
      placement({ turnNumber: 4, id: '3-4', side: 'left' }),
      placement({ turnNumber: 5, id: '2-3', side: 'left' }),
      placement({ turnNumber: 6, id: '2-2', side: 'left' }),
      placement({ turnNumber: 7, id: '1-2', side: 'left' }),
    ])
    const turnIn = layout.find((visual) => visual.turnNumber === 5)!
    const doubleAtTurn = layout.find((visual) => visual.turnNumber === 6)!
    const nextTile = layout.find((visual) => visual.turnNumber === 7)!

    expect(doubleAtTurn).toMatchObject({
      tileId: '2-2',
      direction: 'left',
      orientation: 'vertical',
      rotation: 0,
      connectedPip: 2,
    })
    expect(nextTile).toMatchObject({
      tileId: '1-2',
      direction: 'up',
      orientation: 'vertical',
      rotation: 0,
      connectedPip: 2,
      exposedPip: 1,
    })
    expect(overlapArea(turnIn, doubleAtTurn)).toBe(0)
    expect(overlapArea(doubleAtTurn, nextTile)).toBe(0)
  })

  it('separates left and right chains into mirrored vertical lanes', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '0-6', side: 'right' }),
      placement({ turnNumber: 3, id: '0-1', side: 'right' }),
      placement({ turnNumber: 4, id: '1-2', side: 'right' }),
      placement({ turnNumber: 5, id: '2-3', side: 'right' }),
      placement({ turnNumber: 6, id: '3-4', side: 'right' }),
      placement({ turnNumber: 7, id: '4-5', side: 'right' }),
      placement({ turnNumber: 8, id: '5-6', side: 'left' }),
      placement({ turnNumber: 9, id: '4-5', side: 'left' }),
      placement({ turnNumber: 10, id: '3-4', side: 'left' }),
      placement({ turnNumber: 11, id: '2-3', side: 'left' }),
      placement({ turnNumber: 12, id: '1-2', side: 'left' }),
      placement({ turnNumber: 13, id: '0-1', side: 'left' }),
    ])
    const rightVertical = layout.find((visual) => visual.turnNumber === 6)
    const leftVertical = layout.find((visual) => visual.turnNumber === 12)

    expect(rightVertical).toMatchObject({ direction: 'down' })
    expect(leftVertical).toMatchObject({ direction: 'up' })
    expect(rightVertical?.y).toBeGreaterThan(0)
    expect(leftVertical?.y).toBeLessThan(0)
  })

  it('orients fallback horizontal tiles so the connected pip faces the endpoint', () => {
    const rightWithRightPipConnected = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '2-6', side: 'right' }),
    ])
    const rightWithLeftPipConnected = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '6-2', side: 'right' }),
    ])
    const leftWithRightPipConnected = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '2-6', side: 'left' }),
    ])
    const leftWithLeftPipConnected = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '6-2', side: 'left' }),
    ])

    expect(rightWithRightPipConnected[1]).toMatchObject({ rotation: 90 })
    expect(rightWithLeftPipConnected[1]).toMatchObject({ rotation: 270 })
    expect(leftWithRightPipConnected[1]).toMatchObject({ rotation: 270 })
    expect(leftWithLeftPipConnected[1]).toMatchObject({ rotation: 90 })
  })

  it('orients fallback downward tiles so the connected pip faces up', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '6-1', side: 'right' }),
      placement({ turnNumber: 3, id: '1-2', side: 'right' }),
      placement({ turnNumber: 4, id: '2-3', side: 'right' }),
      placement({ turnNumber: 5, id: '3-6', side: 'right' }),
      placement({ turnNumber: 6, id: '2-6', side: 'right' }),
    ])

    expect(layout[5]).toMatchObject({
      tileId: '2-6',
      direction: 'down',
      rotation: 180,
    })
  })

  it('marks only the latest move as latest for saved geometry', () => {
    const layout = createDominoBoardLayout([
      placement({
        turnNumber: 1,
        id: '1-2',
        side: 'start',
        visual: { x: 0, y: 0, rotation: 90, orientation: 'horizontal' },
      }),
      placement({
        turnNumber: 2,
        id: '2-3',
        side: 'right',
        visual: { x: 57, y: 0, rotation: 90, orientation: 'horizontal' },
      }),
    ])

    expect(layout.filter((visual) => visual.isLatest)).toEqual([
      expect.objectContaining({ turnNumber: 2 }),
    ])
  })

  it('keeps saved double orientation instead of recalculating it', () => {
    const [, double] = createDominoBoardLayout([
      placement({
        turnNumber: 1,
        id: '1-2',
        side: 'start',
        visual: { x: 0, y: 0, rotation: 90, orientation: 'horizontal' },
      }),
      placement({
        turnNumber: 2,
        id: '2-2',
        side: 'right',
        visual: {
          x: 44,
          y: 0,
          rotation: 0,
          orientation: 'vertical',
          connectedPip: 2,
          exposedPip: 2,
        },
      }),
    ])

    expect(double).toMatchObject({
      tileId: '2-2',
      x: 44,
      y: 0,
      rotation: 0,
      orientation: 'vertical',
      connectedPip: 2,
      exposedPip: 2,
    })
  })

  it('returns finite coordinates for every fallback placement', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '1-2', side: 'start' }),
      ...Array.from({ length: 12 }, (_, index) =>
        placement({
          turnNumber: index + 2,
          id: index % 2 === 0 ? '0-1' : '2-3',
          side: index % 2 === 0 ? 'left' : 'right',
        }),
      ),
    ])

    for (const visual of layout) {
      expect(Number.isFinite(visual.x)).toBe(true)
      expect(Number.isFinite(visual.y)).toBe(true)
      expect(Number.isFinite(visual.rotation)).toBe(true)
    }
  })
})

describe('getDominoRotationForConnection', () => {
  const tileRightConnected = { left: 2, right: 6, isDouble: false }
  const tileLeftConnected = { left: 6, right: 2, isDouble: false }

  it('uses low-on-top and high-on-bottom asset orientation for horizontal endpoints', () => {
    const normalizedTile = { left: 2, right: 6, isDouble: false }

    expect(
      getDominoRotationForConnection({
        tile: normalizedTile,
        connectedPip: 6,
        direction: 'right',
        orientation: 'horizontal',
      }),
    ).toBe(90)
    expect(
      getDominoRotationForConnection({
        tile: normalizedTile,
        connectedPip: 6,
        direction: 'left',
        orientation: 'horizontal',
      }),
    ).toBe(270)
    expect(
      getDominoRotationForConnection({
        tile: normalizedTile,
        connectedPip: 2,
        direction: 'right',
        orientation: 'horizontal',
      }),
    ).toBe(270)
    expect(
      getDominoRotationForConnection({
        tile: normalizedTile,
        connectedPip: 2,
        direction: 'left',
        orientation: 'horizontal',
      }),
    ).toBe(90)
  })

  it('maps connected pips to the endpoint-facing side for every direction', () => {
    expect(
      getDominoRotationForConnection({
        tile: tileRightConnected,
        connectedPip: 6,
        direction: 'right',
        orientation: 'horizontal',
      }),
    ).toBe(90)
    expect(
      getDominoRotationForConnection({
        tile: tileLeftConnected,
        connectedPip: 6,
        direction: 'right',
        orientation: 'horizontal',
      }),
    ).toBe(270)
    expect(
      getDominoRotationForConnection({
        tile: tileRightConnected,
        connectedPip: 6,
        direction: 'left',
        orientation: 'horizontal',
      }),
    ).toBe(270)
    expect(
      getDominoRotationForConnection({
        tile: tileLeftConnected,
        connectedPip: 6,
        direction: 'left',
        orientation: 'horizontal',
      }),
    ).toBe(90)
    expect(
      getDominoRotationForConnection({
        tile: tileRightConnected,
        connectedPip: 6,
        direction: 'down',
        orientation: 'vertical',
      }),
    ).toBe(180)
    expect(
      getDominoRotationForConnection({
        tile: tileLeftConnected,
        connectedPip: 6,
        direction: 'down',
        orientation: 'vertical',
      }),
    ).toBe(0)
    expect(
      getDominoRotationForConnection({
        tile: tileRightConnected,
        connectedPip: 6,
        direction: 'up',
        orientation: 'vertical',
      }),
    ).toBe(0)
    expect(
      getDominoRotationForConnection({
        tile: tileLeftConnected,
        connectedPip: 6,
        direction: 'up',
        orientation: 'vertical',
      }),
    ).toBe(180)
  })

  it('keeps doubles crosswise based on orientation', () => {
    const double = { left: 6, right: 6, isDouble: true }

    expect(
      getDominoRotationForConnection({
        tile: double,
        connectedPip: 6,
        direction: 'right',
        orientation: 'vertical',
      }),
    ).toBe(0)
    expect(
      getDominoRotationForConnection({
        tile: double,
        connectedPip: 6,
        direction: 'down',
        orientation: 'horizontal',
      }),
    ).toBe(90)
  })
})
