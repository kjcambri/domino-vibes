import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { myHandQueryKey } from './useMyHand'
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: gameRoomQueryKey(gameId) })
          void queryClient.invalidateQueries({ queryKey: myHandQueryKey(gameId) })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_moves',
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: gameRoomQueryKey(gameId) })
          void queryClient.invalidateQueries({ queryKey: myHandQueryKey(gameId) })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [gameId, queryClient])
}
