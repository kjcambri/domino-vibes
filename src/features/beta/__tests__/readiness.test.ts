import { describe, expect, it } from 'vitest'
import {
  betaReadinessMissions,
  getBetaMissionsByPriority,
  getRequiredBetaMissionCount,
} from '../readiness'

describe('beta readiness missions', () => {
  it('keeps blocker missions visible for private beta release gates', () => {
    const blockers = getBetaMissionsByPriority('blocker')

    expect(blockers.map((mission) => mission.id)).toEqual([
      'account-flow',
      'secure-hands',
    ])
  })

  it('counts required beta missions without optional polish work', () => {
    expect(getRequiredBetaMissionCount()).toBe(betaReadinessMissions.length)
  })

  it('includes mobile play as a first-class private beta mission', () => {
    expect(getBetaMissionsByPriority('mobile')).toEqual([
      expect.objectContaining({
        id: 'mobile-play',
        label: 'Try one mobile browser',
      }),
    ])
  })
})
