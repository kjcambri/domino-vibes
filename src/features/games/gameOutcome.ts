import {
  type GameEndedReason,
  type GameRoomInfo,
  type GameRoomPlayer,
} from './types'

function getPlayerName(player?: GameRoomPlayer) {
  return player?.displayName || player?.username || 'Player'
}

export function getRoundResultText(game: GameRoomInfo) {
  if (game.roundWinnerPlayerId) {
    return 'Round winner earned 1 point.'
  }

  return 'Round is complete.'
}

export function getGameOverTitle(
  game: GameRoomInfo,
  players: GameRoomPlayer[],
) {
  if (game.winnerPlayerId) {
    const winner = players.find((player) => player.playerId === game.winnerPlayerId)

    return `Game Over - ${getPlayerName(winner)} wins!`
  }

  return 'Game Over - No Winner'
}

export function getGameOverReason(game: Pick<GameRoomInfo, 'endedReason'>) {
  const reasons: Record<GameEndedReason, string> = {
    player_reached_6:
      'First to 6 points while at least one player remained at 0.',
    all_players_scored: 'All players won at least one round.',
    cancelled: 'This game was cancelled.',
  }

  if (game.endedReason && game.endedReason in reasons) {
    return reasons[game.endedReason]
  }

  return 'The game has finished.'
}
