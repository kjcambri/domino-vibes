import { describe, expect, it } from 'vitest'
import {
  gameRoomKeys,
  getGameRoomPollInterval,
  getMyHandPollInterval,
} from '../queryKeys'

describe('gameRoomKeys', () => {
  it('uses stable cache keys for game room and current hand data', () => {
    expect(gameRoomKeys.detail('game-1')).toEqual(['game-room', 'game-1'])
    expect(gameRoomKeys.myHand('game-1')).toEqual(['my-hand', 'game-1'])
  })

  it('polls live games quickly and completed games gently', () => {
    expect(getGameRoomPollInterval('active')).toBe(1000)
    expect(getGameRoomPollInterval('setup')).toBe(2000)
    expect(getGameRoomPollInterval('round_finished')).toBe(5000)
    expect(getGameRoomPollInterval('finished')).toBe(false)
    expect(getGameRoomPollInterval('cancelled')).toBe(false)
  })

  it('polls the current secure hand only while it can change', () => {
    expect(getMyHandPollInterval('active')).toBe(1500)
    expect(getMyHandPollInterval('setup')).toBe(2000)
    expect(getMyHandPollInterval('round_finished')).toBe(5000)
    expect(getMyHandPollInterval('finished')).toBe(false)
    expect(getMyHandPollInterval('cancelled')).toBe(false)
  })
})
