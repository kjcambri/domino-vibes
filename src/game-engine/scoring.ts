import { type DominoTile, type PlayerEngineState, type RoundScores } from './types'

export function calculateHandPips(hand: DominoTile[]): number {
  return hand.reduce((total, tile) => total + tile.pipTotal, 0)
}

export function buildScores(
  players: PlayerEngineState[],
  winnerPlayerId: string,
): RoundScores {
  return Object.fromEntries(
    players.map((player) => [
      player.playerId,
      player.playerId === winnerPlayerId ? 0 : calculateHandPips(player.hand),
    ]),
  )
}
