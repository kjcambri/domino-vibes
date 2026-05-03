import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { refreshGameRoomQueries } from './queryKeys'

export function useGameRealtime(gameId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!gameId) {
      return
    }

    const handleRealtimeEvent = (tableName: string, eventType: string) => {
      if (import.meta.env.DEV) {
        console.debug('[Domino Vibes realtime]', {
          table: tableName,
          eventType,
          gameId,
        })
      }

      void refreshGameRoomQueries(queryClient, gameId)
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
        (payload) => {
          handleRealtimeEvent('games', payload.eventType)
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
        (payload) => {
          handleRealtimeEvent('game_players', payload.eventType)
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
        (payload) => {
          handleRealtimeEvent('game_moves', payload.eventType)
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_player_hands',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          handleRealtimeEvent('game_player_hands', payload.eventType)
        },
      )
      .subscribe((status) => {
        if (import.meta.env.DEV) {
          console.debug('[Domino Vibes realtime]', {
            table: 'subscription',
            eventType: status,
            gameId,
          })
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [gameId, queryClient])
}
