import { useEffect, useRef } from 'react'
import { type ChatMessage } from '../chat/types'
import { type GameRoomInfo } from '../games/types'
import { type TableRoom } from '../tables/types'
import {
  getChatSoundEvents,
  getGameSoundEvents,
  getTableSoundEvents,
} from './soundEvents'
import { playSound } from './soundService'

export function useGameSoundEvents({
  game,
  currentUserPlayerId,
  enabled,
}: {
  game: GameRoomInfo | null
  currentUserPlayerId?: string | null
  enabled: boolean
}) {
  const previousGameRef = useRef<GameRoomInfo | null>(null)

  useEffect(() => {
    if (!game) {
      previousGameRef.current = null
      return
    }

    const cues = getGameSoundEvents(
      previousGameRef.current,
      game,
      currentUserPlayerId,
    )
    previousGameRef.current = game

    if (!enabled) {
      return
    }

    for (const cue of cues) {
      void playSound(cue, { enabled })
    }
  }, [currentUserPlayerId, enabled, game])
}

export function useTableSoundEvents({
  enabled,
  room,
}: {
  enabled: boolean
  room: TableRoom | null
}) {
  const previousRoomRef = useRef<TableRoom | null>(null)

  useEffect(() => {
    if (!room) {
      previousRoomRef.current = null
      return
    }

    const cues = getTableSoundEvents(previousRoomRef.current, room)
    previousRoomRef.current = room

    if (!enabled) {
      return
    }

    for (const cue of cues) {
      void playSound(cue, { enabled })
    }
  }, [enabled, room])
}

export function useChatSoundEvents({
  currentUserId,
  enabled,
  messages,
}: {
  currentUserId?: string | null
  enabled: boolean
  messages: ChatMessage[] | null
}) {
  const previousMessagesRef = useRef<ChatMessage[] | null>(null)

  useEffect(() => {
    if (!messages) {
      previousMessagesRef.current = null
      return
    }

    const cues = getChatSoundEvents(
      previousMessagesRef.current,
      messages,
      currentUserId,
    )
    previousMessagesRef.current = messages

    if (!enabled) {
      return
    }

    for (const cue of cues) {
      void playSound(cue, { enabled })
    }
  }, [currentUserId, enabled, messages])
}
