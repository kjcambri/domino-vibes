import { describe, expect, it } from 'vitest'
import {
  getLivePreviewPollInterval,
  homePreviewKeys,
  mapFeaturedLiveGamePreviewPayload,
} from '../livePreviewUtils'

describe('livePreviewUtils', () => {
  it('uses a stable query key and gentle visible-page polling', () => {
    expect(homePreviewKeys.featuredLiveGame()).toEqual([
      'home',
      'featured-live-game-preview',
    ])
    expect(getLivePreviewPollInterval(true)).toBe(12000)
    expect(getLivePreviewPollInterval(false)).toBe(false)
  })

  it('returns null when there is no active featured game', () => {
    expect(mapFeaturedLiveGamePreviewPayload(null)).toBeNull()
  })

  it('maps safe public live preview data without carrying hand tiles', () => {
    const preview = mapFeaturedLiveGamePreviewPayload({
      gameId: 'game-1',
      tableId: 'table-1',
      tableName: 'Palm Court',
      gameMode: 'cutthroat_4',
      status: 'active',
      currentRoundNumber: 2,
      pointsToWin: 6,
      moveCount: 9,
      dominoesInPlay: 6,
      boardState: {
        placements: [
          {
            tile: { id: '2-6', left: 2, right: 6, isDouble: false, pipTotal: 8 },
            turnNumber: 1,
            x: 0,
            y: 0,
            rotation: 90,
            orientation: 'horizontal',
          },
          {
            tile: { id: '6-6', left: 6, right: 6, isDouble: true, pipTotal: 12 },
            turnNumber: 2,
            x: 42,
            y: 0,
            rotation: 0,
            orientation: 'vertical',
          },
        ],
        openEnds: { left: 2, right: 6 },
      },
      players: [
        {
          displayName: 'Kevon',
          seatNumber: 1,
          score: 3,
          handCount: 5,
          isCurrentTurn: true,
          tiles: [{ id: '6-6' }],
        },
      ],
    })

    expect(preview).toEqual({
      gameId: 'game-1',
      tableId: 'table-1',
      tableName: 'Palm Court',
      gameMode: 'cutthroat_4',
      status: 'active',
      currentRoundNumber: 2,
      pointsToWin: 6,
      moveCount: 9,
      dominoesInPlay: 6,
      boardState: {
        placements: [
          {
            tile: { id: '2-6', left: 2, right: 6, isDouble: false, pipTotal: 8 },
            turnNumber: 1,
            x: 0,
            y: 0,
            rotation: 90,
            orientation: 'horizontal',
          },
          {
            tile: { id: '6-6', left: 6, right: 6, isDouble: true, pipTotal: 12 },
            turnNumber: 2,
            x: 42,
            y: 0,
            rotation: 0,
            orientation: 'vertical',
          },
        ],
        openEnds: { left: 2, right: 6 },
      },
      players: [
        {
          displayName: 'Kevon',
          seatNumber: 1,
          score: 3,
          handCount: 5,
          isCurrentTurn: true,
        },
      ],
    })
  })
})
