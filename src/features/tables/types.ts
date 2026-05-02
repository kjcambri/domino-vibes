import { type GameMode, type TableStatus } from '../lobby/types'

export type SeatPlayer = {
  username: string
  displayName: string
  avatarUrl: string | null
}

export type TableSeat = {
  id: string
  tableId: string
  seatNumber: number
  playerId: string | null
  isReady: boolean
  joinedAt: string | null
  updatedAt: string
  player: SeatPlayer | null
}

export type TableRoomInfo = {
  id: string
  name: string
  gameMode: GameMode
  status: TableStatus
  maxPlayers: number
  isSystemCreated: boolean
  createdAt: string
  updatedAt: string
}

export type TableRoom = {
  table: TableRoomInfo
  seats: TableSeat[]
}

export type SeatActionResult = {
  tableId: string
  seatNumber?: number
}

export type CurrentTable = {
  tableId: string
  tableName: string
  gameMode: GameMode
  status: TableStatus
  seatNumber: number
  joinedAt: string | null
  currentGameId: string | null
}
