import { Send } from 'lucide-react'
import { type KeyboardEvent, useState } from 'react'
import { Button } from '../common/Button'
import {
  CHAT_MAX_BODY_LENGTH,
  normalizeChatBody,
  validateChatBody,
} from '../../features/chat/chatUtils'

export function ChatComposer({
  isSending,
  onSend,
  placeholder = 'Talk across the table...',
}: {
  isSending: boolean
  onSend: (body: string) => Promise<void>
  placeholder?: string
}) {
  const [body, setBody] = useState('')
  const [localError, setLocalError] = useState('')
  const normalizedBody = normalizeChatBody(body)
  const remainingCount = CHAT_MAX_BODY_LENGTH - normalizedBody.length
  const canSend = normalizedBody.length > 0 && remainingCount >= 0 && !isSending

  async function handleSend() {
    const validation = validateChatBody(body)

    if (!validation.isValid) {
      setLocalError(validation.message)
      return
    }

    setLocalError('')
    try {
      await onSend(validation.body)
      setBody('')
    } catch {
      // The parent mutation owns the friendly error display.
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()

      if (canSend) {
        void handleSend()
      }
    }
  }

  return (
    <div className="grid gap-2">
      <label className="sr-only" htmlFor="chat-message">
        Chat message
      </label>
      <textarea
        aria-label="Chat message"
        className="min-h-20 resize-none rounded-2xl border border-cream-100/12 bg-green-950/58 px-4 py-3 text-sm leading-6 text-cream-50 outline-none transition placeholder:text-cream-100/35 focus:border-gold-300/50 focus:ring-2 focus:ring-gold-300/25"
        disabled={isSending}
        id="chat-message"
        maxLength={CHAT_MAX_BODY_LENGTH + 50}
        onChange={(event) => {
          setBody(event.target.value)
          setLocalError('')
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        value={body}
      />
      <div className="flex items-center justify-between gap-3">
        <p
          className={
            remainingCount < 0
              ? 'text-xs font-bold text-red-100'
              : 'text-xs font-semibold text-cream-100/50'
          }
        >
          {remainingCount} characters left
        </p>
        <Button
          className="min-h-10 gap-2 px-4 py-2"
          disabled={!canSend}
          onClick={() => void handleSend()}
        >
          <Send aria-hidden="true" size={16} />
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </div>
      {localError ? (
        <p className="rounded-2xl border border-red-300/25 bg-red-800/20 px-3 py-2 text-sm font-semibold text-red-100">
          {localError}
        </p>
      ) : null}
    </div>
  )
}
