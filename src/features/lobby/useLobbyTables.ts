import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { myCurrentTableQueryKey } from '../tables/useMyCurrentTable'
import { getLobbyTables, joinTable } from './lobbyService'

export const lobbyTablesQueryKey = ['lobby-tables'] as const

export function useLobbyTables() {
  return useQuery({
    queryKey: lobbyTablesQueryKey,
    queryFn: getLobbyTables,
  })
}

export function useJoinTable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: joinTable,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lobbyTablesQueryKey })
      void queryClient.invalidateQueries({ queryKey: myCurrentTableQueryKey })
    },
  })
}
