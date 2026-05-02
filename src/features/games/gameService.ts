import { supabase } from '../../lib/supabaseClient'
import { type GameRoom } from './types'

export async function getGameRoom(gameId: string): Promise<GameRoom> {
  const { data, error } = await supabase.rpc('get_game_room', {
    p_game_id: gameId,
  })

  if (error) {
    throw error
  }

  return data as GameRoom
}
