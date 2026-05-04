export type ChatRoomType = 'lobby' | 'table' | 'game'

export type ChatMessage = {
  id: string
  roomType: ChatRoomType
  roomId: string | null
  senderId: string
  senderDisplayName: string
  body: string
  isSystem: boolean
  isDeleted: boolean
  deletedAt: string | null
  clientMessageId: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export type ChatMessageRow = {
  id: string
  room_type: ChatRoomType
  room_id: string | null
  sender_id: string
  sender_display_name: string
  body: string
  is_system: boolean
  is_deleted: boolean
  deleted_at: string | null
  client_message_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export type ChatValidationResult =
  | {
      isValid: true
      body: string
    }
  | {
      isValid: false
      message: string
    }
