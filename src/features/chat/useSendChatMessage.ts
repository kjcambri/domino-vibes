import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendChatMessage } from './chatService'
import { chatKeys, normalizeChatBody } from './chatUtils'
import { type ChatRoomType } from './types'

export function useSendChatMessage({
  roomType,
  roomId,
}: {
  roomType: ChatRoomType
  roomId?: string | null
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: string) =>
      sendChatMessage({
        roomType,
        roomId,
        body: normalizeChatBody(body),
        clientMessageId:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}`,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: chatKeys.messages(roomType, roomId),
      })
    },
  })
}
