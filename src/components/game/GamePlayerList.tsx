import { CircleCheck, UserRound } from 'lucide-react'
import { GameCard } from '../ui/GameCard'
import { StatusChip } from '../ui/StatusChip'
import { getPlayerPresence } from '../../features/games/presence'
import { type GameRoomPlayer } from '../../features/games/types'
import { cn } from '../../lib/cn'

export function GamePlayerList({
  players,
  currentTurnPlayerId,
}: {
  players: GameRoomPlayer[]
  currentTurnPlayerId?: string | null
}) {
  return (
    <section className="grid gap-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
        Scoreboard · Points to Win: 6
      </p>
      {players.map((player) => {
        const presence = getPlayerPresence({
          isConnected: player.isConnected,
          lastSeenAt: player.lastSeenAt,
        })
        const isCurrentTurn = player.playerId === currentTurnPlayerId

        return (
          <GameCard
            className={cn(
              'flex items-center gap-3 p-4',
              isCurrentTurn && 'border-gold-300/45 bg-gold-300/12 shadow-gold',
            )}
            key={player.seatNumber}
            variant={isCurrentTurn ? 'gold' : 'felt'}
          >
            <span className="grid size-11 place-items-center rounded-2xl border border-cream-100/12 bg-green-950/48 text-cream-100 shadow-wood">
              {isCurrentTurn ? (
                <CircleCheck aria-hidden="true" size={18} />
              ) : (
                <UserRound aria-hidden="true" size={18} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-gold-200">
                Seat {player.seatNumber}
              </p>
              <p className="mt-1 font-black text-cream-50">
                {player.displayName || player.username || 'Open seat'}
              </p>
              <p className="mt-1 text-sm text-cream-100/65">
                {`${player.handCount} tiles · ${player.score} points · round +${player.roundScore}`}
              </p>
              <p className="mt-1 text-xs font-semibold text-cream-100/52">
                {presence.description}
              </p>
            </div>
            <div className="grid justify-items-end gap-2">
              <StatusChip
                className={
                  presence.status === 'active'
                    ? 'border-teal-300/30 bg-teal-300/12 text-teal-100'
                    : ''
                }
                tone={presence.status === 'active' ? 'felt' : 'cream'}
              >
                {presence.label}
              </StatusChip>
              {player.hasPassed ? (
                <span className="rounded-full border border-cream-100/10 bg-cream-100/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-cream-100/75">
                  Passed
                </span>
              ) : null}
            </div>
          </GameCard>
        )
      })}
    </section>
  )
}
