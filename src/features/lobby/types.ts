export type TableStatus = 'waiting' | 'full' | 'in_game' | 'finished' | 'closed'

export type GameMode = 'cutthroat_4'

export type LobbyTable = {
  id: string
  name: string
  gameMode: GameMode
  status: TableStatus
  maxPlayers: number
  seatedCount: number
  isSystemCreated: boolean
  createdAt: string
}

export type JoinTableResult = {
  tableId: string
  seatNumber: number
}

export type LobbyTableRow = {
  id: string
  name: string
  game_mode: GameMode
  status: TableStatus
  max_players: number
  seated_count: number
  is_system_created: boolean
  created_at: string
}
