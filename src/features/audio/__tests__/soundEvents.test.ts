import { describe, expect, it } from 'vitest'
import {
  getChatSoundEvents,
  getGameSoundEvents,
  getTableSoundEvents,
} from '../soundEvents'
import { type ChatMessage } from '../../chat/types'
import {
  type BoardPlacementDto,
  type GameMove,
  type GameRoomInfo,
} from '../../games/types'
import { type TableRoom } from '../../tables/types'

const placedTile: BoardPlacementDto = {
  tile: {
    id: '6-6',
    left: 6,
    right: 6,
    isDouble: true,
    pipTotal: 12,
  },
  playedBy: 'p2',
  side: 'start',
  leftValue: 6,
  rightValue: 6,
  turnNumber: 1,
}

const playMove: GameMove = {
  id: 'move-1',
  gameId: 'game-1',
  playerId: 'p2',
  roundNumber: 1,
  moveNumber: 1,
  moveType: 'play',
  tile: placedTile.tile,
  side: 'start',
  createdAt: '2026-05-10T12:00:00Z',
}

const baseGame: GameRoomInfo = {
  id: 'game-1',
  tableId: 'table-1',
  tableName: 'Table 1',
  gameMode: 'cutthroat_4',
  status: 'active',
  currentRoundNumber: 1,
  currentTurnPlayerId: 'p2',
  boardState: {
    placements: [],
    openEnds: { left: null, right: null },
  },
  moveCount: 0,
  lastMove: null,
  roundWinnerPlayerId: null,
  roundEndedReason: null,
  winnerPlayerId: null,
  endedReason: null,
  createdAt: '2026-05-10T12:00:00Z',
  startedAt: '2026-05-10T12:00:00Z',
  finishedAt: null,
}

const baseTable: TableRoom = {
  table: {
    id: 'table-1',
    name: 'Table 1',
    gameMode: 'cutthroat_4',
    status: 'waiting',
    maxPlayers: 4,
    currentGameId: null,
    isSystemCreated: true,
    createdAt: '2026-05-10T12:00:00Z',
    updatedAt: '2026-05-10T12:00:00Z',
  },
  seats: [1, 2, 3, 4].map((seatNumber) => ({
    id: `seat-${seatNumber}`,
    tableId: 'table-1',
    seatNumber,
    playerId: null,
    isReady: false,
    joinedAt: null,
    lastSeenAt: null,
    updatedAt: '2026-05-10T12:00:00Z',
    player: null,
  })),
}

const messageFrom = (senderId: string): ChatMessage => ({
  id: `message-${senderId}`,
  roomType: 'game',
  roomId: 'game-1',
  senderId,
  senderDisplayName: senderId,
  body: 'Good move',
  isSystem: false,
  isDeleted: false,
  deletedAt: null,
  clientMessageId: null,
  metadata: {},
  createdAt: '2026-05-10T12:00:00Z',
})

describe('soundEvents', () => {
  it('stays quiet on initial game hydration', () => {
    expect(getGameSoundEvents(null, baseGame, 'p1')).toEqual([])
  })

  it('plays a heavier cue when the first domino lands', () => {
    const current = {
      ...baseGame,
      currentTurnPlayerId: 'p1',
      boardState: {
        ...baseGame.boardState,
        placements: [placedTile],
      },
      lastMove: playMove,
      moveCount: 1,
    }

    expect(getGameSoundEvents(baseGame, current, 'p1')).toEqual([
      'tile-start',
      'your-turn',
    ])
  })

  it('plays pass, round, game, and next-round cues from state transitions', () => {
    expect(
      getGameSoundEvents(
        { ...baseGame, moveCount: 1 },
        {
          ...baseGame,
          moveCount: 2,
          lastMove: { ...playMove, moveType: 'pass', tile: null, side: null },
        },
        'p1',
      ),
    ).toEqual(['pass-turn'])

    expect(
      getGameSoundEvents(
        baseGame,
        { ...baseGame, status: 'round_finished' },
        'p1',
      ),
    ).toEqual(['round-won'])

    expect(
      getGameSoundEvents(baseGame, { ...baseGame, status: 'finished' }, 'p1'),
    ).toEqual(['game-over'])

    expect(
      getGameSoundEvents(
        { ...baseGame, status: 'round_finished', currentRoundNumber: 1 },
        { ...baseGame, status: 'active', currentRoundNumber: 2 },
        'p1',
      ),
    ).toEqual(['round-start'])
  })

  it('plays table cues for new seats, readiness, and game start', () => {
    const withSeat = {
      ...baseTable,
      seats: baseTable.seats.map((seat) =>
        seat.seatNumber === 1 ? { ...seat, playerId: 'p1' } : seat,
      ),
    }
    const withReady = {
      ...withSeat,
      seats: withSeat.seats.map((seat) =>
        seat.seatNumber === 1 ? { ...seat, isReady: true } : seat,
      ),
    }

    expect(getTableSoundEvents(baseTable, withSeat)).toEqual(['seat-join'])
    expect(getTableSoundEvents(withSeat, withReady)).toEqual(['ready-up'])
    expect(
      getTableSoundEvents(withReady, {
        ...withReady,
        table: { ...withReady.table, status: 'in_game', currentGameId: 'game-1' },
      }),
    ).toEqual(['game-start'])
  })

  it('only plays chat cues for newly received messages from other players', () => {
    expect(getChatSoundEvents(null, [messageFrom('p2')], 'p1')).toEqual([])
    expect(getChatSoundEvents([], [messageFrom('p1')], 'p1')).toEqual([])
    expect(getChatSoundEvents([], [messageFrom('p2')], 'p1')).toEqual([
      'chat-message',
    ])
  })
})
