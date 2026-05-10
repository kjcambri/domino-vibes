const diceBearPixelArtBaseUrl = 'https://api.dicebear.com/9.x/pixel-art/svg'

export type AvatarPreset = {
  id: string
  label: string
  seed: string
  url: string
}

const avatarSeeds = [
  ['table-captain', 'Table Captain'],
  ['double-six', 'Double Six'],
  ['island-ace', 'Island Ace'],
  ['gold-seat', 'Gold Seat'],
  ['felt-master', 'Felt Master'],
  ['club-starter', 'Club Starter'],
] as const

export const avatarPresets: AvatarPreset[] = avatarSeeds.map(([id, label]) => ({
  id,
  label,
  seed: `domino-vibes-${id}`,
  url: createPixelArtAvatarUrl(`domino-vibes-${id}`),
}))

export function createPixelArtAvatarUrl(seed: string) {
  const params = new URLSearchParams({
    seed,
    radius: '18',
    backgroundColor: '061f18,f2c14e,21c7a8,fff4d6',
  })

  return `${diceBearPixelArtBaseUrl}?${params.toString()}`
}

export function isAvatarPresetUrl(value: string | null | undefined) {
  if (!value) {
    return true
  }

  return avatarPresets.some((preset) => preset.url === value)
}

export function getAvatarPresetByUrl(value: string | null | undefined) {
  return avatarPresets.find((preset) => preset.url === value) ?? avatarPresets[0]
}
