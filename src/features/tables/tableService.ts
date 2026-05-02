import { supabase } from '../../lib/supabaseClient'
import { type CurrentTable, type SeatActionResult, type TableRoom } from './types'

type SeatActionRow = {
  table_id: string
  seat_number?: number
}

type CurrentTableRow = {
  table_id: string
  table_name: string
  game_mode: CurrentTable['gameMode']
  status: CurrentTable['status']
  seat_number: number
  joined_at: string | null
  current_game_id: string | null
}

function toCurrentTable(row: CurrentTableRow): CurrentTable {
  return {
    tableId: row.table_id,
    tableName: row.table_name,
    gameMode: row.game_mode,
    status: row.status,
    seatNumber: row.seat_number,
    joinedAt: row.joined_at,
    currentGameId: row.current_game_id,
  }
}

export async function getTableRoom(tableId: string): Promise<TableRoom> {
  const { data, error } = await supabase.rpc('get_table_room', {
    p_table_id: tableId,
  })

  if (error) {
    throw error
  }

  return data as TableRoom
}

export async function sitAtTable({
  tableId,
  seatNumber,
}: {
  tableId: string
  seatNumber: number
}): Promise<SeatActionResult> {
  const { data, error } = await supabase.rpc('sit_at_table', {
    p_table_id: tableId,
    p_seat_number: seatNumber,
  })

  if (error) {
    throw error
  }

  const result = (data as SeatActionRow[])[0]

  return {
    tableId: result.table_id,
    seatNumber: result.seat_number,
  }
}

export async function leaveTable(tableId: string): Promise<SeatActionResult> {
  const { data, error } = await supabase.rpc('leave_table', {
    p_table_id: tableId,
  })

  if (error) {
    throw error
  }

  const result = (data as SeatActionRow[])[0]

  return {
    tableId: result.table_id,
  }
}

export async function getMyCurrentTable(): Promise<CurrentTable | null> {
  const { data, error } = await supabase.rpc('get_my_current_table')

  if (error) {
    throw error
  }

  const result = (data as CurrentTableRow[] | null)?.[0]

  return result ? toCurrentTable(result) : null
}
