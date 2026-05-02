import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { gameRoomQueryKey } from './useGameRoom'

export function useGameRealtime(gameId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!gameId) {
      return
    }

    const channel = supabase
      .channel(`game-room-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: gameRoomQueryKey(gameId) })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [gameId, queryClient])
}
