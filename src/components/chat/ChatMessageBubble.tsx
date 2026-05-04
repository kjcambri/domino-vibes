import { type ChatMessage } from '../../features/chat/types'
import { cn } from '../../lib/cn'

function formatChatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function ChatMessageBubble({
  message,
  isOwnMessage,
}: {
  message: ChatMessage
  isOwnMessage: boolean
}) {
  if (message.isSystem) {
    return (
      <div className="rounded-2xl border border-gold-300/20 bg-gold-300/10 px-3 py-2 text-center text-xs font-bold text-gold-100">
        {message.body}
      </div>
    )
  }

  return (
    <article
      className={cn(
        'rounded-2xl border px-3 py-2 shadow-wood',
        isOwnMessage
          ? 'ml-8 border-gold-300/30 bg-gold-300/14'
          : 'mr-8 border-cream-100/10 bg-green-950/58',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-xs font-black uppercase tracking-[0.12em] text-gold-200">
          {isOwnMessage ? 'You' : message.senderDisplayName}
        </p>
        <time className="shrink-0 text-[0.68rem] font-semibold text-cream-100/45">
          {formatChatTime(message.createdAt)}
        </time>
      </div>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-cream-50">
        {message.isDeleted ? 'Message deleted' : message.body}
      </p>
    </article>
  )
}
