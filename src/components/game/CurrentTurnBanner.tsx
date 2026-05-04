import { CircleDot, Clock, Crown, Sparkles } from 'lucide-react'
import { GameCard } from '../ui/GameCard'
import { StatusChip } from '../ui/StatusChip'
import { type GameRoomPlayer } from '../../features/games/types'
import { cn } from '../../lib/cn'

export function CurrentTurnBanner({
  currentTurnPlayerId,
  players,
  currentUserPlayerId,
  status,
  roundWinnerPlayerId,
}: {
  currentTurnPlayerId: string | null
  players: GameRoomPlayer[]
  currentUserPlayerId?: string | null
  status: string
  roundWinnerPlayerId?: string | null
}) {
  const currentPlayer = players.find(
    (player) => player.playerId === currentTurnPlayerId,
  )
  const winner = players.find(
    (player) => player.playerId === roundWinnerPlayerId,
  )
  const isMyTurn = currentTurnPlayerId === currentUserPlayerId
  const currentName =
    currentPlayer?.displayName || currentPlayer?.username || 'another player'
  const winnerName = winner?.displayName || winner?.username || 'Round winner'
  const isFinished = status === 'finished'
  const isRoundFinished = status === 'round_finished'
  const Icon = isFinished ? Crown : isRoundFinished ? Sparkles : isMyTurn ? CircleDot : Clock
  const variant =
    isFinished || isRoundFinished ? 'gold' : isMyTurn && status === 'active' ? 'gold' : 'felt'

  return (
    <GameCard
      className={cn(
        'relative overflow-hidden',
        isMyTurn &&
          status === 'active' &&
          'border-gold-300/45 shadow-[0_18px_54px_rgba(242,193,78,0.18),0_20px_60px_rgba(0,0,0,0.28)]',
      )}
      variant={variant}
    >
      {isMyTurn && status === 'active' ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_30%,rgba(242,193,78,0.22),transparent_12rem)]" />
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <div className="relative min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
            {isFinished
              ? 'Game over'
              : isRoundFinished
                ? 'Round finished'
                : 'Current turn'}
          </p>
          <p className="mt-2 text-xl font-black text-cream-50">
            {isFinished
              ? 'Final points are in'
              : isRoundFinished
                ? `${winnerName} won the round`
                : isMyTurn
                  ? 'Your turn'
                  : `Waiting for ${currentName}`}
          </p>
        </div>
        <div className="relative grid justify-items-end gap-2">
          <span
            className={cn(
              'grid size-12 place-items-center rounded-2xl border border-gold-300/25 bg-green-950/35 text-gold-100',
              isMyTurn && status === 'active' && 'animate-pulse shadow-gold',
            )}
          >
            <Icon aria-hidden="true" size={20} />
          </span>
          {isMyTurn && status === 'active' ? (
            <StatusChip className="bg-gold-300 text-green-950" tone="gold">
              Play
            </StatusChip>
          ) : null}
        </div>
      </div>
      <p className="relative mt-2 text-sm leading-6 text-cream-100/72">
        {isFinished
          ? 'This game is complete. Return to the lobby when you are ready.'
          : isRoundFinished
            ? 'Round-win points are updated. Start the next round if the game is still alive.'
            : isMyTurn
              ? 'Pick a tile from your tray, then choose a side.'
              : 'The table will update as soon as the move lands.'}
      </p>
    </GameCard>
  )
}
