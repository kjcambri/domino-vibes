import { MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../common/Button'
import { GameCard } from '../ui/GameCard'
import { StatusChip } from '../ui/StatusChip'
import { useAppStore } from '../../app/store'
import { useChatSoundEvents } from '../../features/audio/useSoundEvents'
import { useAuth } from '../../features/auth/useAuth'
import { getFriendlyChatError } from '../../features/chat/chatUtils'
import { type ChatRoomType } from '../../features/chat/types'
import { useChatMessages } from '../../features/chat/useChatMessages'
import { useChatRealtime } from '../../features/chat/useChatRealtime'
import { useSendChatMessage } from '../../features/chat/useSendChatMessage'
import { ChatComposer } from './ChatComposer'
import { ChatMessageList } from './ChatMessageList'

export function ChatPanel({
  roomType,
  roomId = null,
  title = 'Table Talk',
  compact = false,
  defaultOpen = false,
}: {
  roomType: ChatRoomType
  roomId?: string | null
  title?: string
  compact?: boolean
  defaultOpen?: boolean
}) {
  const { user } = useAuth()
  const tableSoundEnabled = useAppStore((state) => state.tableSoundEnabled)
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const messagesQuery = useChatMessages({ roomType, roomId, isOpen })
  const sendMessage = useSendChatMessage({ roomType, roomId })
  useChatRealtime({ roomType, roomId, enabled: isOpen })
  const messageCount = messagesQuery.data?.length ?? 0
  const error = messagesQuery.error ?? sendMessage.error
  useChatSoundEvents({
    currentUserId: user?.id,
    enabled: tableSoundEnabled && isOpen,
    messages: messagesQuery.data ?? null,
  })

  async function handleSend(body: string) {
    await sendMessage.mutateAsync(body)
  }

  return (
    <GameCard
      className={compact ? 'overflow-hidden p-4' : 'overflow-hidden'}
      variant="felt"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-300">
            Social
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-black text-cream-50">
            <MessageCircle aria-hidden="true" size={18} />
            {title}
          </h2>
        </div>
        <div className="grid justify-items-end gap-2">
          <StatusChip className="border-teal-300/25 bg-teal-300/10 text-teal-100" tone="felt">
            {messageCount} msgs
          </StatusChip>
          <Button
            className="min-h-9 px-3 py-2 text-xs"
            onClick={() => setIsOpen((current) => !current)}
            variant="secondary"
          >
            {isOpen ? 'Hide' : 'Open'}
          </Button>
        </div>
      </div>

      {isOpen ? (
        <div className="mt-4 grid gap-4">
          {messagesQuery.isLoading ? (
            <div className="rounded-2xl border border-cream-100/10 bg-green-950/35 px-4 py-4 text-sm font-bold text-cream-100/72">
              Loading table talk...
            </div>
          ) : (
            <ChatMessageList
              currentUserId={user?.id}
              messages={messagesQuery.data ?? []}
            />
          )}

          {error ? (
            <p className="rounded-2xl border border-red-300/25 bg-red-800/20 px-3 py-2 text-sm font-semibold text-red-100">
              {getFriendlyChatError(error)}
            </p>
          ) : null}

          <ChatComposer
            isSending={sendMessage.isPending}
            onSend={handleSend}
          />
          <p className="text-xs leading-5 text-cream-100/48">
            MVP chat is visible to this room. Moderation, reports, and richer
            controls arrive later.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-cream-100/62">
          Open chat for quick table talk without covering the game.
        </p>
      )}
    </GameCard>
  )
}
