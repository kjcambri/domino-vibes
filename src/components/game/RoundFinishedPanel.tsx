import { Card } from '../common/Card'
import { Button } from '../common/Button'
import {
  getGameOverReason,
  getGameOverTitle,
  getRoundResultText,
} from '../../features/games/gameOutcome'
import { type GameRoomInfo, type GameRoomPlayer } from '../../features/games/types'

export function RoundFinishedPanel({
  game,
  players,
  currentUserPlayerId,
  isStartingNextRound = false,
  isLeavingFinishedGame = false,
  nextRoundErrorMessage,
  leaveFinishedGameErrorMessage,
  onStartNextRound,
  onReturnToLobby,
}: {
  game: GameRoomInfo
  players: GameRoomPlayer[]
  currentUserPlayerId?: string | null
  isStartingNextRound?: boolean
  isLeavingFinishedGame?: boolean
  nextRoundErrorMessage?: string | null
  leaveFinishedGameErrorMessage?: string | null
  onStartNextRound?: () => void
  onReturnToLobby?: () => void
}) {
  if (game.status !== 'round_finished' && game.status !== 'finished') {
    return null
  }

  const winner = players.find((player) => player.playerId === game.roundWinnerPlayerId)
  const endReason =
    game.roundEndedReason === 'blocked' ? 'Blocked table' : 'Player went out'
  const isParticipant = Boolean(currentUserPlayerId) && players.some(
    (player) => player.playerId === currentUserPlayerId,
  )
  const canStartNextRound = Boolean(isParticipant && onStartNextRound)
  const isGameFinished = game.status === 'finished'

  return (
    <Card
      className={
        isGameFinished
          ? 'border-red-300/30 bg-gradient-to-b from-red-900/28 to-green-950/82 shadow-warm'
          : 'border-gold-300/35 bg-gradient-to-b from-gold-300/16 to-green-950/78 shadow-gold'
      }
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
        {isGameFinished ? 'Game complete' : 'Round complete'}
      </p>
      <h2 className="mt-2 text-2xl font-black text-cream-50">
        {isGameFinished
          ? getGameOverTitle(game, players)
          : `${winner?.displayName || winner?.username || 'Winner'} takes the round`}
      </h2>
      <p className="mt-2 text-sm font-bold text-cream-100/75">
        {isGameFinished ? getGameOverReason(game) : endReason}
      </p>
      {!isGameFinished ? (
        <p className="mt-2 text-sm leading-6 text-cream-100/72">
          {getRoundResultText(game)}
        </p>
      ) : null}
      <div className="mt-4 grid gap-2">
        {players.map((player) => (
          <div
            className="flex items-center justify-between rounded-md border border-cream-100/10 bg-green-950/50 px-4 py-3"
            key={player.seatNumber}
          >
            <div>
              <p className="font-bold text-cream-50">
                {player.displayName || player.username || `Seat ${player.seatNumber}`}
              </p>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-cream-100/50">
                Seat {player.seatNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="font-black text-gold-100">+{player.roundScore}</p>
              <p className="text-xs text-cream-100/60">
                {player.score} points
              </p>
            </div>
          </div>
        ))}
      </div>
      {nextRoundErrorMessage && !isGameFinished ? (
        <p className="mt-4 rounded-md border border-red-300/25 bg-red-900/25 px-3 py-2 text-sm font-semibold text-red-100">
          {nextRoundErrorMessage}
        </p>
      ) : null}
      {leaveFinishedGameErrorMessage && isGameFinished ? (
        <p className="mt-4 rounded-md border border-red-300/25 bg-red-900/25 px-3 py-2 text-sm font-semibold text-red-100">
          {leaveFinishedGameErrorMessage}
        </p>
      ) : null}
      {isGameFinished ? (
        <div className="mt-4 grid gap-2">
          <Button
            className="w-full"
            disabled={isLeavingFinishedGame || !onReturnToLobby}
            onClick={onReturnToLobby}
          >
            {isLeavingFinishedGame ? 'Returning to lobby...' : 'Return to Lobby'}
          </Button>
          <p className="text-sm leading-6 text-cream-100/72">
            This releases your seat. When every player leaves, the table opens
            for a new game.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          <Button
            disabled={!canStartNextRound || isStartingNextRound}
            onClick={onStartNextRound}
          >
            {isStartingNextRound ? 'Starting next round...' : 'Start Next Round'}
          </Button>
          <p className="text-sm leading-6 text-cream-100/72">
            {canStartNextRound
              ? 'Round-win points stay on the table. Fresh hands and a clean board are dealt for the next round.'
              : 'Only seated players can start the next round.'}
          </p>
        </div>
      )}
    </Card>
  )
}
