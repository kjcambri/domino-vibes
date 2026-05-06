import { Armchair, UserRound } from 'lucide-react'
import { Button } from '../common/Button'
import { GameCard } from '../ui/GameCard'
import { StatusChip } from '../ui/StatusChip'
import { getPlayerPresence } from '../../features/games/presence'
import { type TableSeat } from '../../features/tables/types'
import { cn } from '../../lib/cn'

type SeatCardProps = {
  seat: TableSeat
  canSit: boolean
  isBusy: boolean
  isCurrentUserSeat: boolean
  onSit: (seatNumber: number) => void
}

export function SeatCard({
  seat,
  canSit,
  isBusy,
  isCurrentUserSeat,
  onSit,
}: SeatCardProps) {
  const isOccupied = Boolean(seat.playerId)
  const playerName = seat.player?.displayName || seat.player?.username
  const presence = getPlayerPresence({
    isConnected: isOccupied,
    lastSeenAt: seat.lastSeenAt,
  })

  return (
    <GameCard
      className={cn(
        'grid gap-4 p-4 transition hover:border-teal-300/25 hover:shadow-[0_18px_45px_rgba(0,0,0,0.18)]',
        isCurrentUserSeat &&
          'border-gold-300/45 bg-gold-300/12 shadow-gold',
      )}
      variant={isCurrentUserSeat ? 'gold' : 'felt'}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-black uppercase tracking-[0.14em] text-gold-200">
          Seat {seat.seatNumber}
        </span>
        <div className="flex items-center gap-2">
          {seat.isReady ? (
            <StatusChip className="border-teal-300/30 bg-teal-300/12 text-teal-100" tone="felt">
              Ready
            </StatusChip>
          ) : null}
          <span className="grid size-11 place-items-center rounded-xl border border-cream-100/12 bg-green-950/45 text-cream-100 shadow-wood">
            {isOccupied ? (
              <UserRound aria-hidden="true" size={19} />
            ) : (
              <Armchair aria-hidden="true" size={19} />
            )}
          </span>
        </div>
      </div>

      <div>
        <p className="text-lg font-black text-cream-50">
          {isOccupied
            ? `${playerName}${isCurrentUserSeat ? ' (you)' : ''}`
            : 'Open seat'}
        </p>
        <p className="mt-1 text-sm text-cream-100/65">
          {isOccupied
            ? seat.isReady
              ? 'Ready for table start'
              : 'Not ready yet'
            : 'Waiting for a player'}
        </p>
        {isOccupied ? (
          <p className="mt-2 text-xs font-black uppercase tracking-[0.1em] text-teal-100/70">
            {presence.label} · {presence.description}
          </p>
        ) : null}
      </div>

      {!isOccupied && canSit ? (
        <Button
          className="w-full"
          disabled={isBusy}
          onClick={() => onSit(seat.seatNumber)}
          variant="secondary"
        >
          {isBusy ? 'Sitting...' : 'Sit Here'}
        </Button>
      ) : null}
    </GameCard>
  )
}
