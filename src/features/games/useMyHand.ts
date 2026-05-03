import { useQuery } from '@tanstack/react-query'
import { getMyHand } from './gameService'
import { gameRoomKeys, getMyHandPollInterval } from './queryKeys'
import { type GameStatus } from './types'

export function myHandQueryKey(gameId?: string) {
  return gameRoomKeys.myHand(gameId)
}

export function useMyHand(gameId?: string, gameStatus?: GameStatus) {
  return useQuery({
    queryKey: myHandQueryKey(gameId),
    queryFn: () => getMyHand(gameId!),
    enabled: Boolean(gameId),
    refetchInterval: getMyHandPollInterval(gameStatus),
    refetchIntervalInBackground: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}
