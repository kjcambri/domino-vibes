import { useEffect, useRef } from 'react'
import { type ChatMessage } from '../../features/chat/types'
import { ChatMessageBubble } from './ChatMessageBubble'

export function ChatMessageList({
  messages,
  currentUserId,
}: {
  messages: ChatMessage[]
  currentUserId?: string | null
}) {
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="grid min-h-32 place-items-center rounded-2xl border border-cream-100/10 bg-green-950/35 px-4 py-6 text-center">
        <p className="text-sm font-bold text-cream-100/72">
          No messages yet. Start the table talk.
        </p>
      </div>
    )
  }

  return (
    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
      {messages.map((message) => (
        <ChatMessageBubble
          isOwnMessage={message.senderId === currentUserId}
          key={message.id}
          message={message}
        />
      ))}
      <div ref={endRef} />
    </div>
  )
}
