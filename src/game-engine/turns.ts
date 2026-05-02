import { type PlayerEngineState, type PlayerId, type RoundState } from './types'

export function advanceTurn(state: RoundState): PlayerId {
  const currentPlayer = state.players.find(
    (player) => player.playerId === state.currentTurnPlayerId,
  )

  if (!currentPlayer) {
    throw new Error('Current turn player not found')
  }

  const sortedPlayers = [...state.players].sort(
    (first, second) => first.turnOrder - second.turnOrder,
  )
  const currentIndex = sortedPlayers.findIndex(
    (player) => player.playerId === currentPlayer.playerId,
  )
  const nextPlayer = sortedPlayers[(currentIndex + 1) % sortedPlayers.length]

  if (!nextPlayer) {
    throw new Error('Next player not found')
  }

  return nextPlayer.playerId
}

export function clonePlayers(players: PlayerEngineState[]): PlayerEngineState[] {
  return players.map((player) => ({
    ...player,
    hand: [...player.hand],
  }))
}
