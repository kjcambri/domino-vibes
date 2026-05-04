import { supabase } from '../../lib/supabaseClient'
import { logDebug, logError } from '../../lib/logger'
import {
  type BoardSide,
  type DominoTileDto,
  type GameRoom,
  type GamePresenceHeartbeatResult,
  type LeaveFinishedGameResult,
  type MarkStalePlayersResult,
  type MyHand,
  type StartNextRoundResult,
} from './types'

type MyHandRow = {
  game_id: string
  player_id: string
  tiles: DominoTileDto[]
}

type StartNextRoundRow = {
  game_id: string
  round_number: number
  status: 'active'
  current_turn_player_id: string
}

type LeaveFinishedGameRow = {
  game_id: string
  table_id: string
  table_reset: boolean
  remaining_seated_count: number
}

type GamePresenceHeartbeatRow = {
  game_id: string
  player_id: string
  last_seen_at: string
}

type MarkStalePlayersRow = {
  stale_count: number
}

export async function getGameRoom(gameId: string): Promise<GameRoom> {
  const { data, error } = await supabase.rpc('get_game_room', {
    p_game_id: gameId,
  })

  if (error) {
    throw error
  }

  return data as GameRoom
}

export async function getMyHand(gameId: string): Promise<MyHand> {
  const { data, error } = await supabase.rpc('get_my_hand', {
    p_game_id: gameId,
  })

  if (error) {
    throw error
  }

  const hand = (data as MyHandRow[])[0]

  if (!hand) {
    throw new Error('hand_not_found')
  }

  return {
    gameId: hand.game_id,
    playerId: hand.player_id,
    tiles: hand.tiles,
  }
}

export async function playTile({
  gameId,
  tileId,
  side,
}: {
  gameId: string
  tileId: string
  side: BoardSide
}): Promise<GameRoom> {
  const { data, error } = await supabase.rpc('play_tile', {
    p_game_id: gameId,
    p_tile_id: tileId,
    p_side: side,
  })

  if (error) {
    throw error
  }

  return data as GameRoom
}

export async function passTurn(gameId: string): Promise<GameRoom> {
  const { data, error } = await supabase.rpc('pass_turn', {
    p_game_id: gameId,
  })

  if (error) {
    throw error
  }

  return data as GameRoom
}

export async function startNextRound(
  gameId: string,
): Promise<StartNextRoundResult> {
  const { data, error } = await supabase.rpc('start_next_round', {
    p_game_id: gameId,
  })

  if (error) {
    logError('[Domino Vibes] start_next_round failed', { error, gameId })
    throw error
  }

  const result = (data as StartNextRoundRow[])[0]

  if (!result) {
    throw new Error('next_round_failed')
  }

  return {
    gameId: result.game_id,
    roundNumber: result.round_number,
    status: result.status,
    currentTurnPlayerId: result.current_turn_player_id,
  }
}

export async function leaveFinishedGame(
  gameId: string,
): Promise<LeaveFinishedGameResult> {
  const { data, error } = await supabase.rpc('leave_finished_game', {
    p_game_id: gameId,
  })

  if (error) {
    logError('[Domino Vibes] leave_finished_game failed', { error, gameId })
    throw error
  }

  const result = (data as LeaveFinishedGameRow[])[0]

  if (!result) {
    throw new Error('leave_finished_game_failed')
  }

  return {
    gameId: result.game_id,
    tableId: result.table_id,
    tableReset: result.table_reset,
    remainingSeatedCount: result.remaining_seated_count,
  }
}

export async function heartbeatGamePresence(
  gameId: string,
): Promise<GamePresenceHeartbeatResult> {
  const { data, error } = await supabase.rpc('heartbeat_game_presence', {
    p_game_id: gameId,
  })

  if (error) {
    logDebug('[Domino Vibes presence] heartbeat_game_presence failed', {
      error,
      gameId,
    })
    throw error
  }

  const result = (data as GamePresenceHeartbeatRow[])[0]

  if (!result) {
    throw new Error('presence_update_failed')
  }

  return {
    gameId: result.game_id,
    playerId: result.player_id,
    lastSeenAt: result.last_seen_at,
  }
}

export async function markStalePlayers(
  gameId: string,
): Promise<MarkStalePlayersResult> {
  const { data, error } = await supabase.rpc('mark_stale_players', {
    p_game_id: gameId,
  })

  if (error) {
    logDebug('[Domino Vibes presence] mark_stale_players failed', {
      error,
      gameId,
    })
    throw error
  }

  const result = (data as MarkStalePlayersRow[])[0]

  return {
    staleCount: result?.stale_count ?? 0,
  }
}
