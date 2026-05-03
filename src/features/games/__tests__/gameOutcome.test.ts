import { describe, expect, it } from 'vitest'
import {
  getGameOverReason,
  getGameOverTitle,
  getRoundResultText,
} from '../gameOutcome'
import { type GameRoomInfo, type GameRoomPlayer } from '../types'

const baseGame: GameRoomInfo = {
  id: 'game-1',
  tableId: 'table-1',
  tableName: 'Rum Shop Table 1',
  gameMode: 'cutthroat_4',
  status: 'round_finished',
  currentRoundNumber: 3,
  currentTurnPlayerId: null,
  boardState: {
    placements: [],
    openEnds: { left: null, right: null },
  },
  moveCount: 0,
  lastMove: null,
  roundWinnerPlayerId: 'p1',
  roundEndedReason: 'player_went_out',
  winnerPlayerId: null,
  endedReason: null,
  finishedAt: null,
  createdAt: '2026-05-02T00:00:00Z',
  startedAt: '2026-05-02T00:00:00Z',
}

const players: GameRoomPlayer[] = [
  {
    playerId: 'p1',
    seatNumber: 1,
    turnOrder: 1,
    score: 6,
    roundScore: 1,
    hasPassed: false,
    isConnected: true,
    lastSeenAt: '2026-05-02T00:00:00Z',
    handCount: 0,
    username: 'ana',
    displayName: 'Ana',
    avatarUrl: null,
  },
  {
    playerId: 'p2',
    seatNumber: 2,
    turnOrder: 2,
    score: 0,
    roundScore: 0,
    hasPassed: false,
    isConnected: true,
    lastSeenAt: '2026-05-02T00:00:00Z',
    handCount: 4,
    username: 'ben',
    displayName: 'Ben',
    avatarUrl: null,
  },
]

describe('gameOutcome', () => {
  it('describes round-win scoring as one point for the round winner', () => {
    expect(getRoundResultText(baseGame)).toBe('Round winner earned 1 point.')
  })

  it('names the final winner when a player reaches six with someone still at zero', () => {
    expect(
      getGameOverTitle(
        {
          ...baseGame,
          status: 'finished',
          winnerPlayerId: 'p1',
          endedReason: 'player_reached_6',
        },
        players,
      ),
    ).toBe('Game Over - Ana wins!')
  })

  it('explains no-winner endings when every player has scored', () => {
    const game = {
      ...baseGame,
      status: 'finished' as const,
      winnerPlayerId: null,
      endedReason: 'all_players_scored' as const,
    }

    expect(getGameOverTitle(game, players)).toBe('Game Over - No Winner')
    expect(getGameOverReason(game)).toBe('All players won at least one round.')
  })
})
