import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { lobbyTablesQueryKey } from '../lobby/useLobbyTables'
import { myCurrentTableQueryKey } from './useMyCurrentTable'
import {
  createPrivateTable,
  getTableRoom,
  joinPrivateTableByInviteCode,
  leaveTable,
  sitAtTable,
  startGame,
  toggleReady,
} from './tableService'

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

export function useToggleReady(tableId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ready: boolean) => toggleReady({ tableId: tableId!, ready }),
    onSuccess: (room) => {
      queryClient.setQueryData(tableRoomQueryKey(tableId), room)
      void queryClient.invalidateQueries({ queryKey: lobbyTablesQueryKey })
      void queryClient.invalidateQueries({ queryKey: myCurrentTableQueryKey })
    },
  })
}

export function useStartGame(tableId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => startGame(tableId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tableRoomQueryKey(tableId) })
      void queryClient.invalidateQueries({ queryKey: lobbyTablesQueryKey })
      void queryClient.invalidateQueries({ queryKey: myCurrentTableQueryKey })
    },
  })
}

export function useCreatePrivateTable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPrivateTable,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lobbyTablesQueryKey })
      void queryClient.invalidateQueries({ queryKey: myCurrentTableQueryKey })
    },
  })
}

export function useJoinPrivateTable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: joinPrivateTableByInviteCode,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lobbyTablesQueryKey })
      void queryClient.invalidateQueries({ queryKey: myCurrentTableQueryKey })
    },
  })
}
