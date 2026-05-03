import { CircleCheck, UserRound } from 'lucide-react'
import { Card } from '../common/Card'
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
        Players
      </p>
      {players.map((player) => {
        const presence = getPlayerPresence({
          isConnected: player.isConnected,
          lastSeenAt: player.lastSeenAt,
        })

        return (
          <Card
            className={
              player.playerId === currentTurnPlayerId
                ? 'flex items-center gap-3 border-gold-300/35 p-4'
                : 'flex items-center gap-3 p-4'
            }
            key={player.seatNumber}
          >
            <span className="grid size-10 place-items-center rounded-md border border-cream-100/12 bg-green-950/45 text-cream-100">
              {player.playerId === currentTurnPlayerId ? (
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
                {`${player.handCount} tiles · ${player.score} points · This round +${player.roundScore}`}
              </p>
              <p className="mt-1 text-xs font-semibold text-cream-100/52">
                {presence.description}
              </p>
            </div>
            <div className="grid justify-items-end gap-2">
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.1em]',
                  presence.status === 'active'
                    ? 'bg-felt-300/20 text-felt-50'
                    : 'bg-cream-100/8 text-cream-100/65',
                )}
              >
                {presence.label}
              </span>
              {player.hasPassed ? (
                <span className="rounded-full border border-cream-100/10 bg-cream-100/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-cream-100/75">
                  Passed
                </span>
              ) : null}
            </div>
          </Card>
        )
      })}
    </section>
  )
}
