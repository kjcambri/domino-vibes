import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getGameRoom,
  passTurn as passTurnAction,
  playTile as playTileAction,
  startNextRound as startNextRoundAction,
} from './gameService'
import {
  gameRoomKeys,
  getGameRoomPollInterval,
  refreshGameRoomQueries,
} from './queryKeys'
import { useMyHand } from './useMyHand'
import { type BoardSide } from './types'

export function gameRoomQueryKey(gameId?: string) {
  return gameRoomKeys.detail(gameId)
}

export function useGameRoom(gameId?: string) {
  const queryClient = useQueryClient()
  const gameRoomQuery = useQuery({
    queryKey: gameRoomQueryKey(gameId),
    queryFn: () => getGameRoom(gameId!),
    enabled: Boolean(gameId),
    refetchInterval: (query) =>
      getGameRoomPollInterval(query.state.data?.game.status),
    refetchIntervalInBackground: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
  const myHandQuery = useMyHand(gameId, gameRoomQuery.data?.game.status)
  const invalidateGame = async () => {
    if (!gameId) {
      return
    }

    await refreshGameRoomQueries(queryClient, gameId)
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
  const startNextRound = useMutation({
    mutationFn: () => startNextRoundAction(gameId!),
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
      passTurn.error ??
      startNextRound.error,
    playTile,
    passTurn,
    startNextRound,
    isActionPending:
      playTile.isPending || passTurn.isPending || startNextRound.isPending,
    refetch: async () => {
      await Promise.all([gameRoomQuery.refetch(), myHandQuery.refetch()])
    },
  }
}
