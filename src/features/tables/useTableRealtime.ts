import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { lobbyTablesQueryKey } from '../lobby/useLobbyTables'
import { myCurrentTableQueryKey } from './useMyCurrentTable'
import { tableRoomQueryKey } from './useTableRoom'

export function useTableRealtime(tableId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!tableId) {
      return
    }

    const channel = supabase
      .channel(`table-room-${tableId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_tables',
          filter: `id=eq.${tableId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: tableRoomQueryKey(tableId) })
          void queryClient.invalidateQueries({ queryKey: lobbyTablesQueryKey })
          void queryClient.invalidateQueries({ queryKey: myCurrentTableQueryKey })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_seats',
          filter: `table_id=eq.${tableId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: tableRoomQueryKey(tableId) })
          void queryClient.invalidateQueries({ queryKey: lobbyTablesQueryKey })
          void queryClient.invalidateQueries({ queryKey: myCurrentTableQueryKey })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient, tableId])
}
