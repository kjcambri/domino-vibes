import { describe, expect, it } from 'vitest'
import {
  getAllSoundCues,
  getSoundCueConfig,
  isSoundCue,
} from '../soundService'
import { type SoundCue } from '../soundEvents'

const expectedCues: SoundCue[] = [
  'tile-select',
  'tile-start',
  'tile-place',
  'pass-turn',
  'your-turn',
  'round-won',
  'game-over',
  'round-start',
  'seat-join',
  'ready-up',
  'game-start',
  'chat-message',
]

describe('soundService', () => {
  it('provides an audio config for every detected sound cue', () => {
    expect(getAllSoundCues()).toEqual(expectedCues)

    for (const cue of expectedCues) {
      const config = getSoundCueConfig(cue)

      expect(config.sources.length).toBeGreaterThan(0)
      expect(config.volume).toBeGreaterThan(0)
      expect(config.volume).toBeLessThanOrEqual(1)
    }
  })

  it('recognizes only supported sound cues', () => {
    expect(isSoundCue('tile-place')).toBe(true)
    expect(isSoundCue('mystery-noise')).toBe(false)
  })
})
