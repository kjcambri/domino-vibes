import { describe, expect, it } from 'vitest'
import {
  CHAT_MAX_BODY_LENGTH,
  chatKeys,
  getChatPollInterval,
  getFriendlyChatError,
  normalizeChatBody,
  validateChatBody,
} from '../chatUtils'

describe('chatUtils', () => {
  it('trims, strips null characters, and collapses repeated whitespace', () => {
    expect(normalizeChatBody('  Bless\u0000   the   table \n\n crew  ')).toBe(
      'Bless the table crew',
    )
  })

  it('rejects empty messages after normalization', () => {
    expect(validateChatBody(' \n\t ')).toEqual({
      isValid: false,
      message: 'Type a message before sending.',
    })
  })

  it('rejects messages over the max chat length', () => {
    expect(validateChatBody('x'.repeat(CHAT_MAX_BODY_LENGTH + 1))).toEqual({
      isValid: false,
      message: 'Keep chat messages at 500 characters or less.',
    })
  })

  it('accepts valid messages and returns the normalized body', () => {
    expect(validateChatBody('  Good game  ')).toEqual({
      isValid: true,
      body: 'Good game',
    })
  })

  it('uses stable room query keys for lobby and scoped rooms', () => {
    expect(chatKeys.messages('lobby', null)).toEqual([
      'chat-messages',
      'lobby',
      'lobby',
    ])
    expect(chatKeys.messages('table', 'table-1')).toEqual([
      'chat-messages',
      'table',
      'table-1',
    ])
    expect(chatKeys.messages('direct', 'friendship-1')).toEqual([
      'chat-messages',
      'direct',
      'friendship-1',
    ])
  })

  it('polls while open and stays quiet while closed', () => {
    expect(getChatPollInterval(true)).toBe(4000)
    expect(getChatPollInterval(false)).toBe(false)
  })

  it('maps chat errors to friendly copy', () => {
    expect(getFriendlyChatError(new Error('chat_message_too_long'))).toBe(
      'Keep chat messages at 500 characters or less.',
    )
    expect(getFriendlyChatError(new Error('chat_room_access_denied'))).toBe(
      'You are not part of this chat room.',
    )
    expect(getFriendlyChatError(new Error('direct_chat_access_denied'))).toBe(
      'Private messages are only available between accepted friends.',
    )
  })
})
