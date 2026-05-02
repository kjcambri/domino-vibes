import { supabase } from '../../lib/supabaseClient'
import {
  type BoardSide,
  type DominoTileDto,
  type GameRoom,
  type MyHand,
} from './types'

type MyHandRow = {
  game_id: string
  player_id: string
  tiles: DominoTileDto[]
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
