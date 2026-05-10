import { type SoundCue } from './soundEvents'

type SoundCueConfig = {
  sources: string[]
  volume: number
  offsets?: number[]
  duration?: number
  playbackRate?: [number, number]
}

const AUDIO_BASE = '/assets/audio'
const SOUND_CUE_ORDER: SoundCue[] = [
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

const SOUND_CUE_CONFIG: Record<SoundCue, SoundCueConfig> = {
  'tile-select': {
    sources: [`${AUDIO_BASE}/ui/click2.m4a`, `${AUDIO_BASE}/ui/click2.ogg`],
    volume: 0.2,
    playbackRate: [0.96, 1.08],
  },
  'tile-start': {
    sources: [`${AUDIO_BASE}/domino/tile-start.mp3`],
    volume: 0.62,
    duration: 0.65,
    playbackRate: [0.94, 1.04],
  },
  'tile-place': {
    sources: [`${AUDIO_BASE}/domino/tile-place-source.mp3`],
    volume: 0.52,
    offsets: [0.15, 1.4, 2.75, 4.1, 5.4, 7.2, 9.35, 11.1, 14.25, 18.5],
    duration: 0.34,
    playbackRate: [0.92, 1.08],
  },
  'pass-turn': {
    sources: [`${AUDIO_BASE}/domino/tile-place-source.mp3`],
    volume: 0.34,
    offsets: [6.2, 12.55, 19.1],
    duration: 0.24,
    playbackRate: [0.74, 0.84],
  },
  'your-turn': {
    sources: [`${AUDIO_BASE}/ui/switch21.m4a`, `${AUDIO_BASE}/ui/switch21.ogg`],
    volume: 0.3,
    playbackRate: [1, 1.05],
  },
  'round-won': {
    sources: [`${AUDIO_BASE}/ui/switch34.m4a`, `${AUDIO_BASE}/ui/switch34.ogg`],
    volume: 0.42,
    playbackRate: [0.95, 1],
  },
  'game-over': {
    sources: [`${AUDIO_BASE}/ui/switch10.m4a`, `${AUDIO_BASE}/ui/switch10.ogg`],
    volume: 0.5,
    playbackRate: [0.9, 0.96],
  },
  'round-start': {
    sources: [`${AUDIO_BASE}/domino/tile-shuffle.mp3`],
    volume: 0.38,
    offsets: [0.15, 1.35, 2.6, 4.4],
    duration: 1.1,
    playbackRate: [0.96, 1.04],
  },
  'seat-join': {
    sources: [`${AUDIO_BASE}/ui/mouserelease1.m4a`, `${AUDIO_BASE}/ui/mouserelease1.ogg`],
    volume: 0.26,
  },
  'ready-up': {
    sources: [`${AUDIO_BASE}/ui/click3.m4a`, `${AUDIO_BASE}/ui/click3.ogg`],
    volume: 0.28,
  },
  'game-start': {
    sources: [`${AUDIO_BASE}/domino/tile-shuffle.mp3`],
    volume: 0.46,
    offsets: [0.1, 1.9],
    duration: 1.25,
    playbackRate: [0.98, 1.04],
  },
  'chat-message': {
    sources: [`${AUDIO_BASE}/ui/click1.m4a`, `${AUDIO_BASE}/ui/click1.ogg`],
    volume: 0.18,
  },
}

let audioContext: AudioContext | null = null
const bufferCache = new Map<string, Promise<AudioBuffer>>()

export function getAllSoundCues() {
  return [...SOUND_CUE_ORDER]
}

export function isSoundCue(value: string): value is SoundCue {
  return SOUND_CUE_ORDER.includes(value as SoundCue)
}

export function getSoundCueConfig(cue: SoundCue): SoundCueConfig {
  return {
    ...SOUND_CUE_CONFIG[cue],
    sources: [...SOUND_CUE_CONFIG[cue].sources],
  }
}

export function installAudioUnlockListeners() {
  if (typeof document === 'undefined') {
    return () => undefined
  }

  const unlock = () => {
    void unlockAudio().then(() => preloadSounds())
  }

  document.addEventListener('pointerdown', unlock, { passive: true })
  document.addEventListener('keydown', unlock)

  return () => {
    document.removeEventListener('pointerdown', unlock)
    document.removeEventListener('keydown', unlock)
  }
}

export async function unlockAudio() {
  const context = getAudioContext()

  if (!context || context.state !== 'suspended') {
    return
  }

  try {
    await context.resume()
  } catch {
    // Browser policies can reject resume until a stronger user gesture happens.
  }
}

export function preloadSounds(cues: SoundCue[] = SOUND_CUE_ORDER) {
  if (typeof window === 'undefined') {
    return
  }

  for (const cue of cues) {
    for (const source of SOUND_CUE_CONFIG[cue].sources) {
      void loadBuffer(source).catch(() => undefined)
    }
  }
}

export async function playSound(
  cue: SoundCue,
  options: { enabled?: boolean; volumeMultiplier?: number } = {},
) {
  if (options.enabled === false || typeof window === 'undefined') {
    return
  }

  const context = getAudioContext()

  if (!context) {
    return
  }

  if (context.state === 'suspended') {
    try {
      await context.resume()
    } catch {
      return
    }
  }

  const config = SOUND_CUE_CONFIG[cue]
  const buffer = await loadFirstPlayableBuffer(config.sources)

  if (!buffer) {
    return
  }

  const source = context.createBufferSource()
  const gain = context.createGain()
  const offset = pickNumber(config.offsets, 0)
  const duration = Math.min(
    config.duration ?? buffer.duration - offset,
    Math.max(0, buffer.duration - offset),
  )

  if (duration <= 0) {
    return
  }

  source.buffer = buffer
  source.playbackRate.value = pickPlaybackRate(config.playbackRate)
  gain.gain.value = config.volume * (options.volumeMultiplier ?? 1)
  source.connect(gain)
  gain.connect(context.destination)
  source.start(0, offset, duration)
}

export function playTileSound() {
  void playSound('tile-place')
}

export function playPassSound() {
  void playSound('pass-turn')
}

export function playRoundEndSound() {
  void playSound('round-won')
}

export function playGameOverSound() {
  void playSound('game-over')
}

function getAudioContext() {
  if (typeof window === 'undefined') {
    return null
  }

  if (!audioContext) {
    const AudioContextConstructor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext

    if (!AudioContextConstructor) {
      return null
    }

    audioContext = new AudioContextConstructor()
  }

  return audioContext
}

async function loadFirstPlayableBuffer(sources: string[]) {
  for (const source of sources) {
    try {
      return await loadBuffer(source)
    } catch {
      continue
    }
  }

  return null
}

function loadBuffer(source: string) {
  const cachedBuffer = bufferCache.get(source)

  if (cachedBuffer) {
    return cachedBuffer
  }

  const bufferPromise = loadAudioBuffer(source)
  bufferCache.set(source, bufferPromise)
  return bufferPromise
}

async function loadAudioBuffer(source: string) {
  const context = getAudioContext()

  if (!context) {
    throw new Error('AudioContext unavailable')
  }

  const response = await fetch(source)

  if (!response.ok) {
    throw new Error(`Could not load sound asset: ${source}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return context.decodeAudioData(arrayBuffer)
}

function pickNumber(values: number[] | undefined, fallback: number) {
  if (!values || values.length === 0) {
    return fallback
  }

  return values[Math.floor(Math.random() * values.length)] ?? fallback
}

function pickPlaybackRate(range?: [number, number]) {
  if (!range) {
    return 1
  }

  const [min, max] = range
  return min + Math.random() * (max - min)
}
