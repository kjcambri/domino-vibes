import { describe, expect, it } from 'vitest'
import {
  getHiddenRackSlots,
  getRelativeTableSeats,
} from '../tableSeating'
import { type GameRoomPlayer } from '../types'

function player(seatNumber: number, overrides: Partial<GameRoomPlayer> = {}) {
  return {
    playerId: `p${seatNumber}`,
    seatNumber,
    turnOrder: seatNumber,
    score: 0,
    roundScore: 0,
    hasPassed: false,
    isConnected: true,
    lastSeenAt: '2026-05-13T00:00:00Z',
    handCount: 7,
    username: `player${seatNumber}`,
    displayName: `Player ${seatNumber}`,
    avatarUrl: null,
    ...overrides,
  } satisfies GameRoomPlayer
}

describe('tableSeating', () => {
  it('places the current user at the bottom and opponents left, top, and right', () => {
    const seats = getRelativeTableSeats(
      [player(1), player(2), player(3), player(4)],
      'p2',
    )

    expect(seats.bottom?.seatNumber).toBe(2)
    expect(seats.left?.seatNumber).toBe(3)
    expect(seats.top?.seatNumber).toBe(4)
    expect(seats.right?.seatNumber).toBe(1)
  })

  it('uses the first seated player as the bottom fallback when no current user exists', () => {
    const seats = getRelativeTableSeats([player(2), player(4)], null)

    expect(seats.bottom?.seatNumber).toBe(2)
    expect(seats.left).toBeNull()
    expect(seats.top?.seatNumber).toBe(4)
    expect(seats.right).toBeNull()
  })

  it('keeps missing seats empty instead of shifting players into the wrong side', () => {
    const seats = getRelativeTableSeats([player(1), player(3)], 'p1')

    expect(seats.bottom?.seatNumber).toBe(1)
    expect(seats.left).toBeNull()
    expect(seats.top?.seatNumber).toBe(3)
    expect(seats.right).toBeNull()
  })

  it('creates count-only hidden rack slots without tile ids', () => {
    expect(getHiddenRackSlots(3)).toEqual([
      { slotId: 'hidden-domino-1' },
      { slotId: 'hidden-domino-2' },
      { slotId: 'hidden-domino-3' },
    ])
  })

  it('normalizes invalid hidden rack counts to empty slots', () => {
    expect(getHiddenRackSlots(-2)).toEqual([])
    expect(getHiddenRackSlots(2.8)).toHaveLength(2)
  })
})
