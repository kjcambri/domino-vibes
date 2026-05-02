import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { myCurrentTableQueryKey } from '../tables/useMyCurrentTable'
import { lobbyTablesQueryKey } from './useLobbyTables'

export function useLobbyRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('lobby-table-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_tables' },
        () => {
          void queryClient.invalidateQueries({ queryKey: lobbyTablesQueryKey })
          void queryClient.invalidateQueries({ queryKey: myCurrentTableQueryKey })
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'table_seats' },
        () => {
          void queryClient.invalidateQueries({ queryKey: lobbyTablesQueryKey })
          void queryClient.invalidateQueries({ queryKey: myCurrentTableQueryKey })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient])
}
