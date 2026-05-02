import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { lobbyTablesQueryKey } from '../lobby/useLobbyTables'
import { myCurrentTableQueryKey } from './useMyCurrentTable'
import { getTableRoom, leaveTable, sitAtTable } from './tableService'

export function tableRoomQueryKey(tableId?: string) {
  return ['table-room', tableId] as const
}

export function useTableRoom(tableId?: string) {
  return useQuery({
    queryKey: tableRoomQueryKey(tableId),
    queryFn: () => getTableRoom(tableId!),
    enabled: Boolean(tableId),
  })
}

export function useSitAtTable(tableId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (seatNumber: number) => sitAtTable({ tableId: tableId!, seatNumber }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tableRoomQueryKey(tableId) })
      void queryClient.invalidateQueries({ queryKey: lobbyTablesQueryKey })
      void queryClient.invalidateQueries({ queryKey: myCurrentTableQueryKey })
    },
  })
}

export function useLeaveTable(tableId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => leaveTable(tableId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tableRoomQueryKey(tableId) })
      void queryClient.invalidateQueries({ queryKey: lobbyTablesQueryKey })
      void queryClient.invalidateQueries({ queryKey: myCurrentTableQueryKey })
    },
  })
}
