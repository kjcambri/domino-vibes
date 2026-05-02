import { useQuery } from '@tanstack/react-query'
import { getMyHand } from './gameService'

export function myHandQueryKey(gameId?: string) {
  return ['my-hand', gameId] as const
}

export function useMyHand(gameId?: string) {
  return useQuery({
    queryKey: myHandQueryKey(gameId),
    queryFn: () => getMyHand(gameId!),
    enabled: Boolean(gameId),
  })
}
