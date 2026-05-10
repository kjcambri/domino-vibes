import { describe, expect, it } from 'vitest'
import {
  avatarPresets,
  createPixelArtAvatarUrl,
  getAvatarPresetByUrl,
  isAvatarPresetUrl,
} from '../avatarPresets'

describe('avatar presets', () => {
  it('uses DiceBear Pixel Art SVG URLs for every preset', () => {
    expect(avatarPresets.length).toBeGreaterThanOrEqual(6)

    for (const preset of avatarPresets) {
      expect(preset.url).toContain('https://api.dicebear.com/9.x/pixel-art/svg')
      expect(preset.url).toContain(`seed=${encodeURIComponent(preset.seed)}`)
    }
  })

  it('recognizes only curated preset URLs', () => {
    expect(isAvatarPresetUrl(avatarPresets[0]?.url)).toBe(true)
    expect(isAvatarPresetUrl(null)).toBe(true)
    expect(isAvatarPresetUrl('https://example.com/avatar.svg')).toBe(false)
  })

  it('falls back to the first preset for unknown urls', () => {
    expect(getAvatarPresetByUrl('https://example.com/avatar.svg')).toEqual(
      avatarPresets[0],
    )
  })

  it('creates deterministic pixel art urls from seeds', () => {
    expect(createPixelArtAvatarUrl('domino-vibes-test')).toContain(
      'seed=domino-vibes-test',
    )
  })
})
