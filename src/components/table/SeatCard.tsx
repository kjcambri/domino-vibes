import { Armchair, UserRound } from 'lucide-react'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
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
    <Card
      className={cn(
        'grid gap-4 p-4',
        isCurrentUserSeat && 'border-gold-300/35 bg-gold-300/12',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold uppercase tracking-[0.14em] text-gold-200">
          Seat {seat.seatNumber}
        </span>
        <div className="flex items-center gap-2">
          {seat.isReady ? (
            <span className="rounded-full border border-felt-200/30 bg-felt-300/20 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-felt-50">
              Ready
            </span>
          ) : null}
          <span className="grid size-10 place-items-center rounded-md border border-cream-100/12 bg-green-950/45 text-cream-100">
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
          <p className="mt-2 text-xs font-semibold text-cream-100/52">
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
    </Card>
  )
}
