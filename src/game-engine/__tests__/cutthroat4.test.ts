import { describe, expect, it } from 'vitest'
import { createEmptyBoard, placeTileOnBoard } from '../board'
import {
  calculateRoundScores,
  createInitialRound,
  determineBlockedWinner,
  findStartingPlayer,
  passTurn,
  playTile,
} from '../cutthroat4'
import { createTile } from '../tiles'
import { type PlayerEngineState, type RoundState } from '../types'

const playerIds = ['p1', 'p2', 'p3', 'p4']

function player(
  playerId: string,
  turnOrder: number,
  handIds: Array<[number, number]>,
): PlayerEngineState {
  return {
    playerId,
    seatNumber: (turnOrder + 1) as PlayerEngineState['seatNumber'],
    turnOrder,
    hand: handIds.map(([left, right]) => createTile(left, right)),
    hasPassed: false,
  }
}

function state(overrides: Partial<RoundState> = {}): RoundState {
  const players = [
    player('p1', 0, [[6, 6]]),
    player('p2', 1, [[0, 1]]),
    player('p3', 2, [[2, 3]]),
    player('p4', 3, [[4, 5]]),
  ]

  return {
    gameMode: 'cutthroat_4',
    players,
    board: createEmptyBoard(),
    currentTurnPlayerId: 'p1',
    turnNumber: 1,
    consecutivePasses: 0,
    status: 'active',
    roundWinnerPlayerId: null,
    endedReason: null,
    ...overrides,
  }
}

describe('cutthroat_4 engine', () => {
  it('initial round creates 4 players', () => {
    const round = createInitialRound(playerIds, () => 0)

    expect(round.players).toHaveLength(4)
    expect(round.players.every((roundPlayer) => roundPlayer.hand.length === 7)).toBe(
      true,
    )
    expect(round.status).toBe('active')
  })

  it('starting player is highest double', () => {
    const starter = findStartingPlayer([
      player('p1', 0, [[6, 5]]),
      player('p2', 1, [[4, 4]]),
      player('p3', 2, [[6, 6]]),
      player('p4', 3, [[5, 5]]),
    ])

    expect(starter.playerId).toBe('p3')
  })

  it('playTile only works on current player turn', () => {
    const result = playTile(state(), 'p2', '0-1', 'start')

    expect(result.success).toBe(false)
    expect(result.error).toBe('It is not this player’s turn')
  })

  it('playTile rejects tile not owned', () => {
    const result = playTile(state(), 'p1', '0-1', 'start')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Player does not own tile')
  })

  it('passTurn rejects if player has legal move', () => {
    const result = passTurn(state(), 'p1')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Player has a legal move')
  })

  it('passTurn works when no legal move exists', () => {
    const board = placeTileOnBoard(
      createEmptyBoard(),
      createTile(2, 5),
      'start',
      'p4',
      1,
    )
    const result = passTurn(state({ board }), 'p1')

    expect(result.success).toBe(true)
    expect(result.state.currentTurnPlayerId).toBe('p2')
    expect(result.state.consecutivePasses).toBe(1)
  })

  it('round ends when player empties hand', () => {
    const result = playTile(state(), 'p1', '6-6', 'start')

    expect(result.success).toBe(true)
    expect(result.state.status).toBe('round_finished')
    expect(result.state.roundWinnerPlayerId).toBe('p1')
    expect(result.state.endedReason).toBe('player_went_out')
  })

  it('blocked round detection works', () => {
    const board = placeTileOnBoard(
      createEmptyBoard(),
      createTile(6, 6),
      'start',
      'p4',
      1,
    )
    let result = passTurn(
      state({
        board,
        players: [
          player('p1', 0, [[0, 1]]),
          player('p2', 1, [[1, 2]]),
          player('p3', 2, [[2, 3]]),
          player('p4', 3, [[3, 4]]),
        ],
      }),
      'p1',
    )
    result = passTurn(result.state, 'p2')
    result = passTurn(result.state, 'p3')
    result = passTurn(result.state, 'p4')

    expect(result.state.status).toBe('round_finished')
    expect(result.state.endedReason).toBe('blocked')
    expect(result.state.roundWinnerPlayerId).toBe('p1')
  })

  it('scoring works for player_went_out', () => {
    const finished = playTile(state(), 'p1', '6-6', 'start').state

    expect(calculateRoundScores(finished)).toEqual({
      p1: 1,
      p2: 0,
      p3: 0,
      p4: 0,
    })
  })

  it('scoring works for blocked round', () => {
    const players = [
      player('p1', 0, [[1, 1]]),
      player('p2', 1, [[0, 1]]),
      player('p3', 2, [[0, 1], [0, 2]]),
      player('p4', 3, [[3, 3]]),
    ]
    const finished = state({
      players,
      status: 'round_finished',
      endedReason: 'blocked',
      roundWinnerPlayerId: determineBlockedWinner(players).playerId,
    })

    expect(finished.roundWinnerPlayerId).toBe('p2')
    expect(calculateRoundScores(finished)).toEqual({
      p1: 0,
      p2: 1,
      p3: 0,
      p4: 0,
    })
  })

  it('playTile does not mutate original state', () => {
    const original = state()
    const result = playTile(original, 'p1', '6-6', 'start')

    expect(result.success).toBe(true)
    expect(original.players[0].hand).toHaveLength(1)
    expect(original.board.placements).toHaveLength(0)
  })
})
