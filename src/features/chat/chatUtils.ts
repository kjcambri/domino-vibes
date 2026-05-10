import { type ChatRoomType, type ChatValidationResult } from './types'

export const CHAT_MAX_BODY_LENGTH = 500
const CHAT_POLL_INTERVAL_MS = 4000

export const chatKeys = {
  messages: (roomType: ChatRoomType, roomId?: string | null) =>
    ['chat-messages', roomType, roomId ?? 'lobby'] as const,
}

export function normalizeChatBody(body: string) {
  return body.replaceAll('\u0000', '').replace(/\s+/g, ' ').trim()
}

export function validateChatBody(body: string): ChatValidationResult {
  const normalizedBody = normalizeChatBody(body)

  if (!normalizedBody) {
    return {
      isValid: false,
      message: 'Type a message before sending.',
    }
  }

  if (normalizedBody.length > CHAT_MAX_BODY_LENGTH) {
    return {
      isValid: false,
      message: 'Keep chat messages at 500 characters or less.',
    }
  }

  return {
    isValid: true,
    body: normalizedBody,
  }
}

export function getChatPollInterval(isOpen: boolean): number | false {
  return isOpen ? CHAT_POLL_INTERVAL_MS : false
}

function getErrorText(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object') {
    const errorRecord = error as Record<string, unknown>

    return ['message', 'code', 'details', 'hint']
      .map((key) => errorRecord[key])
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
  }

  return String(error)
}

export function getFriendlyChatError(error: unknown) {
  const message = getErrorText(error).toLowerCase()

  if (message.includes('not_authenticated')) {
    return 'You must be logged in to chat.'
  }

  if (
    message.includes('chat_room_access_denied') ||
    message.includes('direct_chat_access_denied') ||
    message.includes('direct_room_required') ||
    message.includes('not_game_participant') ||
    message.includes('not_seated')
  ) {
    return message.includes('direct')
      ? 'Private messages are only available between accepted friends.'
      : 'You are not part of this chat room.'
  }

  if (
    message.includes('chat_message_too_long') ||
    message.includes('body_length') ||
    message.includes('500')
  ) {
    return 'Keep chat messages at 500 characters or less.'
  }

  if (message.includes('chat_message_empty') || message.includes('empty')) {
    return 'Type a message before sending.'
  }

  if (message.includes('chat_rate_limited')) {
    return 'Please wait a moment before sending another message.'
  }

  return 'Could not send message. Try again.'
}
