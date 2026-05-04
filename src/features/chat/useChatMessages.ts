import { useQuery } from '@tanstack/react-query'
import { getChatMessages } from './chatService'
import { chatKeys, getChatPollInterval } from './chatUtils'
import { type ChatRoomType } from './types'

export function useChatMessages({
  roomType,
  roomId,
  isOpen = true,
}: {
  roomType: ChatRoomType
  roomId?: string | null
  isOpen?: boolean
}) {
  return useQuery({
    queryKey: chatKeys.messages(roomType, roomId),
    queryFn: () => getChatMessages({ roomType, roomId }),
    enabled: roomType === 'lobby' || Boolean(roomId),
    refetchInterval: getChatPollInterval(isOpen),
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}
