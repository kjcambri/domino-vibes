import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getGameRoom,
  passTurn as passTurnAction,
  playTile as playTileAction,
} from './gameService'
import { myHandQueryKey, useMyHand } from './useMyHand'
import { type BoardSide } from './types'

export function gameRoomQueryKey(gameId?: string) {
  return ['game-room', gameId] as const
}

export function useGameRoom(gameId?: string) {
  const queryClient = useQueryClient()
  const gameRoomQuery = useQuery({
    queryKey: gameRoomQueryKey(gameId),
    queryFn: () => getGameRoom(gameId!),
    enabled: Boolean(gameId),
  })
  const myHandQuery = useMyHand(gameId)
  const invalidateGame = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: gameRoomQueryKey(gameId) }),
      queryClient.invalidateQueries({ queryKey: myHandQueryKey(gameId) }),
    ])
  }
  const playTile = useMutation({
    mutationFn: ({
      tileId,
      side,
    }: {
      tileId: string
      side: BoardSide
    }) =>
      playTileAction({
        gameId: gameId!,
        tileId,
        side,
      }),
    onSuccess: invalidateGame,
  })
  const passTurn = useMutation({
    mutationFn: () => passTurnAction(gameId!),
    onSuccess: invalidateGame,
  })

  return {
    gameRoom: gameRoomQuery.data ?? null,
    myHand: myHandQuery.data ?? null,
    isLoading: gameRoomQuery.isLoading || myHandQuery.isLoading,
    isError: gameRoomQuery.isError || myHandQuery.isError,
    error:
      gameRoomQuery.error ??
      myHandQuery.error ??
      playTile.error ??
      passTurn.error,
    playTile,
    passTurn,
    isActionPending: playTile.isPending || passTurn.isPending,
    refetch: async () => {
      await Promise.all([gameRoomQuery.refetch(), myHandQuery.refetch()])
    },
  }
}
