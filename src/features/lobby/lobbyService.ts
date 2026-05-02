import { supabase } from '../../lib/supabaseClient'
import {
  type JoinTableResult,
  type LobbyTable,
  type LobbyTableRow,
} from './types'

type JoinTableRow = {
  table_id: string
  seat_number: number
}

function toLobbyTable(row: LobbyTableRow): LobbyTable {
  return {
    id: row.id,
    name: row.name,
    gameMode: row.game_mode,
    status: row.status,
    maxPlayers: row.max_players,
    seatedCount: row.seated_count,
    isSystemCreated: row.is_system_created,
    createdAt: row.created_at,
  }
}

export async function getLobbyTables() {
  const { data, error } = await supabase.rpc('get_lobby_tables')

  if (error) {
    throw error
  }

  return ((data ?? []) as LobbyTableRow[]).map(toLobbyTable)
}

export async function joinTable(tableId: string): Promise<JoinTableResult> {
  const { data, error } = await supabase.rpc('join_table', {
    p_table_id: tableId,
  })

  if (error) {
    throw error
  }

  const result = (data as JoinTableRow[])[0]

  return {
    tableId: result.table_id,
    seatNumber: result.seat_number,
  }
}
