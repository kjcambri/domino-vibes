import { describe, expect, it } from 'vitest'
import { mapSpectatorGameRoomPayload } from '../spectatorUtils'

describe('spectatorUtils', () => {
  it('maps safe spectator payloads without exposing hidden hand tiles', () => {
    const mapped = mapSpectatorGameRoomPayload({
      game: {
        boardState: {
          openEnds: { left: 6, right: 2 },
          placements: [],
        },
        currentRoundNumber: 2,
        currentTurnPlayerId: 'friend-1',
        gameMode: 'cutthroat_4',
        id: 'game-1',
        moveCount: 4,
        status: 'active',
        tableId: 'table-1',
        tableName: 'Havana Room',
      },
      players: [
        {
          avatarUrl: null,
          displayName: 'Friend One',
          handCount: 5,
          handTiles: [{ id: '6-6', left: 6, right: 6 }],
          hasPassed: false,
          isConnected: true,
          lastSeenAt: '2026-05-10T12:00:00Z',
          playerId: 'friend-1',
          roundScore: 0,
          score: 1,
          seatNumber: 1,
          tiles: [{ id: '5-5', left: 5, right: 5 }],
          turnOrder: 1,
          username: 'friend_one',
        },
      ],
    })

    expect(mapped?.game.id).toBe('game-1')
    expect(mapped?.players[0]?.handCount).toBe(5)
    expect(JSON.stringify(mapped)).not.toContain('6-6')
    expect(JSON.stringify(mapped)).not.toContain('5-5')
    expect(JSON.stringify(mapped)).not.toContain('handTiles')
    expect(JSON.stringify(mapped)).not.toContain('tiles')
  })

  it('rejects malformed spectator payloads', () => {
    expect(mapSpectatorGameRoomPayload(null)).toBeNull()
    expect(mapSpectatorGameRoomPayload({ game: { id: 'game-1' } })).toBeNull()
  })
})
