import { Crown, Sparkles } from 'lucide-react'
import { Button } from '../common/Button'
import { GameCard } from '../ui/GameCard'
import { StatusChip } from '../ui/StatusChip'
import {
  getGameOverReason,
  getGameOverTitle,
  getRoundResultText,
} from '../../features/games/gameOutcome'
import { type GameRoomInfo, type GameRoomPlayer } from '../../features/games/types'
import { cn } from '../../lib/cn'

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
  const isParticipant =
    Boolean(currentUserPlayerId) &&
    players.some((player) => player.playerId === currentUserPlayerId)
  const canStartNextRound = Boolean(isParticipant && onStartNextRound)
  const isGameFinished = game.status === 'finished'
  const Icon = isGameFinished ? Crown : Sparkles

  return (
    <GameCard
      className="relative overflow-hidden shadow-gold"
      variant={isGameFinished ? 'danger' : 'gold'}
    >
      <div className="absolute -right-12 -top-12 size-36 rounded-full bg-gold-300/16 blur-2xl" />
      <div className="absolute left-8 top-0 h-px w-32 bg-gradient-to-r from-transparent via-gold-200/60 to-transparent" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-200">
            {isGameFinished ? 'Game complete' : 'Round complete'}
          </p>
          <h2 className="mt-2 text-2xl font-black text-cream-50">
            {isGameFinished
              ? getGameOverTitle(game, players)
              : `${winner?.displayName || winner?.username || 'Winner'} takes the round`}
          </h2>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-gold-300/25 bg-green-950/35 text-gold-100">
          <Icon aria-hidden="true" size={20} />
        </span>
      </div>
      <p className="relative mt-2 text-sm font-bold text-cream-100/75">
        {isGameFinished ? getGameOverReason(game) : endReason}
      </p>
      {!isGameFinished ? (
        <p className="relative mt-2 text-sm leading-6 text-cream-100/72">
          {getRoundResultText(game)}
        </p>
      ) : null}
      <div className="relative mt-4 grid gap-2">
        {players.map((player) => (
          <div
            className={cn(
              'flex items-center justify-between rounded-2xl border border-cream-100/10 bg-green-950/50 px-4 py-3 transition',
              player.roundScore > 0 &&
                'border-gold-300/35 bg-gold-300/12 shadow-[0_0_26px_rgba(242,193,78,0.12)]',
            )}
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
            <div className="grid justify-items-end gap-1 text-right">
              <StatusChip tone={player.roundScore > 0 ? 'gold' : 'cream'}>
                {player.roundScore > 0 ? '+1 point' : '+0'}
              </StatusChip>
              <p className="text-xs text-cream-100/60">{player.score} points</p>
            </div>
          </div>
        ))}
      </div>
      {nextRoundErrorMessage && !isGameFinished ? (
        <p className="relative mt-4 rounded-2xl border border-red-300/25 bg-red-800/25 px-3 py-2 text-sm font-semibold text-red-100">
          {nextRoundErrorMessage}
        </p>
      ) : null}
      {leaveFinishedGameErrorMessage && isGameFinished ? (
        <p className="relative mt-4 rounded-2xl border border-red-300/25 bg-red-800/25 px-3 py-2 text-sm font-semibold text-red-100">
          {leaveFinishedGameErrorMessage}
        </p>
      ) : null}
      {isGameFinished ? (
        <div className="relative mt-4 grid gap-2">
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
        <div className="relative mt-4 grid gap-2">
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
    </GameCard>
  )
}
