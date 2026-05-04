import { describe, expect, it } from 'vitest'
import { noLiveMatchFallback } from '../livePreviewFallback'

describe('livePreviewFallback', () => {
  it('uses clear no-live copy and real domino asset ids', () => {
    expect(noLiveMatchFallback.badge).toBe('NO LIVE MATCH')
    expect(noLiveMatchFallback.label).toBe('WAITING FOR PLAYERS')
    expect(noLiveMatchFallback.title).toBe('No active game right now.')
    expect(noLiveMatchFallback.body).toBe(
      'Start a Cutthroat 4 table and your match can appear here.',
    )
    expect(noLiveMatchFallback.cta).toBe('Pull up a seat in the lobby.')
    expect(noLiveMatchFallback.dominoTileIds).toEqual(['6-4', '2-1', '5-5'])
  })
})
