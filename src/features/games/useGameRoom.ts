import { useQuery } from '@tanstack/react-query'
import { getGameRoom } from './gameService'

export function gameRoomQueryKey(gameId?: string) {
  return ['game-room', gameId] as const
}

export function useGameRoom(gameId?: string) {
  return useQuery({
    queryKey: gameRoomQueryKey(gameId),
    queryFn: () => getGameRoom(gameId!),
    enabled: Boolean(gameId),
  })
}
