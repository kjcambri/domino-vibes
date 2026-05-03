import { type QueryClient } from '@tanstack/react-query'
import { type GameStatus } from './types'

const GAME_ROOM_ACTIVE_POLL_INTERVAL_MS = 1000
const GAME_ROOM_SETUP_POLL_INTERVAL_MS = 2000
const GAME_ROOM_ROUND_FINISHED_POLL_INTERVAL_MS = 5000
const MY_HAND_ACTIVE_POLL_INTERVAL_MS = 1500
const MY_HAND_SETUP_POLL_INTERVAL_MS = 2000
const MY_HAND_ROUND_FINISHED_POLL_INTERVAL_MS = 5000

export const gameRoomKeys = {
  detail: (gameId?: string) => ['game-room', gameId] as const,
  myHand: (gameId?: string) => ['my-hand', gameId] as const,
}

export function getGameRoomPollInterval(
  status?: GameStatus,
): number | false {
  if (status === 'active') {
    return GAME_ROOM_ACTIVE_POLL_INTERVAL_MS
  }

  if (status === 'setup') {
    return GAME_ROOM_SETUP_POLL_INTERVAL_MS
  }

  if (status === 'round_finished') {
    return GAME_ROOM_ROUND_FINISHED_POLL_INTERVAL_MS
  }

  if (status === 'finished' || status === 'cancelled') {
    return false
  }

  return GAME_ROOM_SETUP_POLL_INTERVAL_MS
}

export function getMyHandPollInterval(status?: GameStatus): number | false {
  if (status === 'active') {
    return MY_HAND_ACTIVE_POLL_INTERVAL_MS
  }

  if (status === 'setup') {
    return MY_HAND_SETUP_POLL_INTERVAL_MS
  }

  if (status === 'round_finished') {
    return MY_HAND_ROUND_FINISHED_POLL_INTERVAL_MS
  }

  if (status === 'finished' || status === 'cancelled') {
    return false
  }

  return MY_HAND_SETUP_POLL_INTERVAL_MS
}

export async function refreshGameRoomQueries(
  queryClient: QueryClient,
  gameId: string,
) {
  const gameRoomKey = gameRoomKeys.detail(gameId)
  const myHandKey = gameRoomKeys.myHand(gameId)

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: gameRoomKey }),
    queryClient.invalidateQueries({ queryKey: myHandKey }),
  ])

  await Promise.all([
    queryClient.refetchQueries({ queryKey: gameRoomKey, type: 'active' }),
    queryClient.refetchQueries({ queryKey: myHandKey, type: 'active' }),
  ])
}
