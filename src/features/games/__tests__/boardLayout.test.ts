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

type LayoutPlacement = ReturnType<typeof createDominoBoardLayout>[number]

function visualBounds(visual: LayoutPlacement) {
  const halfWidth = visual.orientation === 'horizontal' ? 28 : 14
  const halfHeight = visual.orientation === 'horizontal' ? 14 : 28

  return {
    left: visual.x - halfWidth,
    right: visual.x + halfWidth,
    top: visual.y - halfHeight,
    bottom: visual.y + halfHeight,
  }
}

function boundsOverlap(first: LayoutPlacement, second: LayoutPlacement) {
  const firstBounds = visualBounds(first)
  const secondBounds = visualBounds(second)

  return (
    firstBounds.left < secondBounds.right &&
    firstBounds.right > secondBounds.left &&
    firstBounds.top < secondBounds.bottom &&
    firstBounds.bottom > secondBounds.top
  )
}

function expectRightToDownTurnConnection(
  previous: LayoutPlacement,
  next: LayoutPlacement,
) {
  const previousBounds = visualBounds(previous)
  const nextBounds = visualBounds(next)

  expect(boundsOverlap(previous, next)).toBe(false)
  expect(previousBounds.bottom).toBe(nextBounds.top)
  expect(previousBounds.right).toBe(nextBounds.right)
}

function expectDownToLeftTurnConnection(
  previous: LayoutPlacement,
  next: LayoutPlacement,
) {
  const previousBounds = visualBounds(previous)
  const nextBounds = visualBounds(next)

  expect(boundsOverlap(previous, next)).toBe(false)
  expect(previousBounds.left).toBe(nextBounds.right)
  expect(previousBounds.bottom).toBe(nextBounds.bottom)
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

  it('connects [5|6] to [6|4] at a turn without stacking the matching halves', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '0-1', side: 'start' }),
      placement({ turnNumber: 2, id: '1-2', side: 'right' }),
      placement({ turnNumber: 3, id: '2-3', side: 'right' }),
      placement({ turnNumber: 4, id: '3-5', side: 'right' }),
      placement({ turnNumber: 5, id: '5-6', side: 'right' }),
      placement({ turnNumber: 6, id: '4-6', side: 'right' }),
    ])
    const previous = layout.find((visual) => visual.turnNumber === 5)!
    const next = layout.find((visual) => visual.turnNumber === 6)!

    expect(previous).toMatchObject({ tileId: '5-6', exposedPip: 6 })
    expect(next).toMatchObject({
      tileId: '4-6',
      connectedPip: 6,
      direction: 'down',
    })
    expectRightToDownTurnConnection(previous, next)
  })

  it('keeps a straight [6|6] to [1|6] to [1|2] connection edge-to-edge', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '1-6', side: 'right' }),
      placement({ turnNumber: 3, id: '1-2', side: 'right' }),
    ])
    const first = layout.find((visual) => visual.turnNumber === 2)!
    const second = layout.find((visual) => visual.turnNumber === 3)!
    const firstBounds = visualBounds(first)
    const secondBounds = visualBounds(second)

    expect(first).toMatchObject({
      tileId: '1-6',
      connectedPip: 6,
      exposedPip: 1,
      x: 42,
      y: 0,
    })
    expect(second).toMatchObject({
      tileId: '1-2',
      connectedPip: 1,
      exposedPip: 2,
      x: 98,
      y: 0,
    })
    expect(boundsOverlap(first, second)).toBe(false)
    expect(firstBounds.right).toBe(secondBounds.left)
    expect(firstBounds.top).toBe(secondBounds.top)
    expect(firstBounds.bottom).toBe(secondBounds.bottom)
  })

  it('keeps a straight [6|4] to [5|4] connection edge-to-edge', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '6-6', side: 'start' }),
      placement({ turnNumber: 2, id: '4-6', side: 'right' }),
      placement({ turnNumber: 3, id: '4-5', side: 'right' }),
    ])
    const first = layout.find((visual) => visual.turnNumber === 2)!
    const second = layout.find((visual) => visual.turnNumber === 3)!
    const firstBounds = visualBounds(first)
    const secondBounds = visualBounds(second)

    expect(first).toMatchObject({
      tileId: '4-6',
      connectedPip: 6,
      exposedPip: 4,
      x: 42,
      y: 0,
    })
    expect(second).toMatchObject({
      tileId: '4-5',
      connectedPip: 4,
      exposedPip: 5,
      x: 98,
      y: 0,
    })
    expect(boundsOverlap(first, second)).toBe(false)
    expect(firstBounds.right).toBe(secondBounds.left)
    expect(firstBounds.top).toBe(secondBounds.top)
    expect(firstBounds.bottom).toBe(secondBounds.bottom)
  })

  it('connects [5|2] to [2|3] at a turn without stacking the matching halves', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '0-1', side: 'start' }),
      placement({ turnNumber: 2, id: '1-4', side: 'right' }),
      placement({ turnNumber: 3, id: '4-6', side: 'right' }),
      placement({ turnNumber: 4, id: '5-6', side: 'right' }),
      placement({ turnNumber: 5, id: '2-5', side: 'right' }),
      placement({ turnNumber: 6, id: '2-3', side: 'right' }),
    ])
    const previous = layout.find((visual) => visual.turnNumber === 5)!
    const next = layout.find((visual) => visual.turnNumber === 6)!

    expect(previous).toMatchObject({ tileId: '2-5', exposedPip: 2 })
    expect(next).toMatchObject({
      tileId: '2-3',
      connectedPip: 2,
      direction: 'down',
    })
    expectRightToDownTurnConnection(previous, next)
  })

  it('connects [3|6] to [4|3] at a turn without stacking the matching halves', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '0-1', side: 'start' }),
      placement({ turnNumber: 2, id: '1-2', side: 'right' }),
      placement({ turnNumber: 3, id: '2-5', side: 'right' }),
      placement({ turnNumber: 4, id: '5-6', side: 'right' }),
      placement({ turnNumber: 5, id: '3-6', side: 'right' }),
      placement({ turnNumber: 6, id: '3-4', side: 'right' }),
    ])
    const previous = layout.find((visual) => visual.turnNumber === 5)!
    const next = layout.find((visual) => visual.turnNumber === 6)!

    expect(previous).toMatchObject({ tileId: '3-6', exposedPip: 3 })
    expect(next).toMatchObject({
      tileId: '3-4',
      connectedPip: 3,
      direction: 'down',
    })
    expectRightToDownTurnConnection(previous, next)
  })

  it('turns from a vertical run to a horizontal run without corner overlap', () => {
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
    const previous = layout.find((visual) => visual.turnNumber === 7)!
    const next = layout.find((visual) => visual.turnNumber === 8)!

    expect(next).toMatchObject({ direction: 'left' })
    expectDownToLeftTurnConnection(previous, next)
  })

  it('defers a threshold turn when the threshold tile is a double', () => {
    const layout = createDominoBoardLayout([
      placement({ turnNumber: 1, id: '0-1', side: 'start' }),
      placement({ turnNumber: 2, id: '1-2', side: 'right' }),
      placement({ turnNumber: 3, id: '2-3', side: 'right' }),
      placement({ turnNumber: 4, id: '3-4', side: 'right' }),
      placement({ turnNumber: 5, id: '4-5', side: 'right' }),
      placement({ turnNumber: 6, id: '5-5', side: 'right' }),
      placement({ turnNumber: 7, id: '5-6', side: 'right' }),
    ])
    const double = layout.find((visual) => visual.turnNumber === 6)!
    const next = layout.find((visual) => visual.turnNumber === 7)!

    expect(double).toMatchObject({
      tileId: '5-5',
      direction: 'right',
      orientation: 'vertical',
    })
    expect(next).toMatchObject({
      tileId: '5-6',
      direction: 'down',
      orientation: 'vertical',
    })
    expect(boundsOverlap(double, next)).toBe(false)
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
