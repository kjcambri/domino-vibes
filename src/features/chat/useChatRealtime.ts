import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { logDebug } from '../../lib/logger'
import { chatKeys } from './chatUtils'
import { type ChatRoomType } from './types'

function getRoomFilter(roomType: ChatRoomType, roomId?: string | null) {
  if (roomType === 'lobby') {
    return `room_type=eq.${roomType}`
  }

  if (!roomId) {
    return null
  }

  return `room_id=eq.${roomId}`
}

export function useChatRealtime({
  roomType,
  roomId,
  enabled = true,
}: {
  roomType: ChatRoomType
  roomId?: string | null
  enabled?: boolean
}) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const filter = getRoomFilter(roomType, roomId)

    if (!enabled || !filter) {
      return
    }

    const channel = supabase
      .channel(`chat-${roomType}-${roomId ?? 'lobby'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter,
        },
        () => {
          logDebug('[Domino Vibes chat realtime]', {
            roomType,
            roomId,
          })
          void queryClient.invalidateQueries({
            queryKey: chatKeys.messages(roomType, roomId),
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, queryClient, roomId, roomType])
}
