import { create } from 'zustand'

const TABLE_SOUND_STORAGE_KEY = 'domino-vibes:table-sound-enabled'

type AppState = {
  tableSoundEnabled: boolean
  setTableSoundEnabled: (enabled: boolean) => void
  toggleTableSound: () => void
}

function getInitialTableSoundEnabled() {
  if (typeof window === 'undefined') {
    return true
  }

  return window.localStorage.getItem(TABLE_SOUND_STORAGE_KEY) !== 'false'
}

function persistTableSoundEnabled(enabled: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(TABLE_SOUND_STORAGE_KEY, String(enabled))
}

export const useAppStore = create<AppState>((set) => ({
  tableSoundEnabled: getInitialTableSoundEnabled(),
  setTableSoundEnabled: (enabled) =>
    set(() => {
      persistTableSoundEnabled(enabled)
      return { tableSoundEnabled: enabled }
    }),
  toggleTableSound: () =>
    set((state) => {
      const enabled = !state.tableSoundEnabled
      persistTableSoundEnabled(enabled)
      return { tableSoundEnabled: enabled }
    }),
}))
