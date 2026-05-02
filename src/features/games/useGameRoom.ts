import { useQuery } from '@tanstack/react-query'
import { getGameRoom } from './gameService'
import { useMyHand } from './useMyHand'

export function gameRoomQueryKey(gameId?: string) {
  return ['game-room', gameId] as const
}

export function useGameRoom(gameId?: string) {
  const gameRoomQuery = useQuery({
    queryKey: gameRoomQueryKey(gameId),
    queryFn: () => getGameRoom(gameId!),
    enabled: Boolean(gameId),
  })
  const myHandQuery = useMyHand(gameId)

  return {
    gameRoom: gameRoomQuery.data ?? null,
    myHand: myHandQuery.data ?? null,
    isLoading: gameRoomQuery.isLoading || myHandQuery.isLoading,
    isError: gameRoomQuery.isError || myHandQuery.isError,
    error: gameRoomQuery.error ?? myHandQuery.error,
    refetch: async () => {
      await Promise.all([gameRoomQuery.refetch(), myHandQuery.refetch()])
    },
  }
}
