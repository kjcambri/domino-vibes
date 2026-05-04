import { supabase } from '../../lib/supabaseClient'
import { type ChatMessage, type ChatMessageRow, type ChatRoomType } from './types'

function toChatMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    roomType: row.room_type,
    roomId: row.room_id,
    senderId: row.sender_id,
    senderDisplayName: row.sender_display_name,
    body: row.body,
    isSystem: row.is_system,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at,
    clientMessageId: row.client_message_id,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  }
}

export async function getChatMessages({
  roomType,
  roomId,
  limit = 50,
}: {
  roomType: ChatRoomType
  roomId?: string | null
  limit?: number
}) {
  const { data, error } = await supabase.rpc('get_chat_messages', {
    p_room_type: roomType,
    p_room_id: roomId ?? null,
    p_limit: limit,
  })

  if (error) {
    throw error
  }

  return ((data ?? []) as ChatMessageRow[]).map(toChatMessage)
}

export async function sendChatMessage({
  roomType,
  roomId,
  body,
  clientMessageId,
}: {
  roomType: ChatRoomType
  roomId?: string | null
  body: string
  clientMessageId?: string | null
}) {
  const { data, error } = await supabase.rpc('send_chat_message', {
    p_room_type: roomType,
    p_room_id: roomId ?? null,
    p_body: body,
    p_client_message_id: clientMessageId ?? null,
  })

  if (error) {
    throw error
  }

  const result = ((data ?? []) as ChatMessageRow[])[0]

  if (!result) {
    throw new Error('chat_send_failed')
  }

  return toChatMessage(result)
}
