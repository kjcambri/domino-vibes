import { create } from 'zustand'

type AppState = {
  tableSoundEnabled: boolean
  toggleTableSound: () => void
}

export const useAppStore = create<AppState>((set) => ({
  tableSoundEnabled: true,
  toggleTableSound: () =>
    set((state) => ({ tableSoundEnabled: !state.tableSoundEnabled })),
}))
