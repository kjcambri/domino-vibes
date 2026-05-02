import { useQuery } from '@tanstack/react-query'
import { getMyCurrentTable } from './tableService'

export const myCurrentTableQueryKey = ['my-current-table'] as const

export function useMyCurrentTable() {
  const query = useQuery({
    queryKey: myCurrentTableQueryKey,
    queryFn: getMyCurrentTable,
  })

  return {
    currentTable: query.data ?? null,
    isCurrentTableLoading: query.isLoading || query.isFetching,
    currentTableError: query.error,
    refetchCurrentTable: query.refetch,
  }
}
