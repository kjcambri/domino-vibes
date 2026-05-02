import { Armchair, UserRound } from 'lucide-react'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { type TableSeat } from '../../features/tables/types'

type SeatCardProps = {
  seat: TableSeat
  canSit: boolean
  isBusy: boolean
  onSit: (seatNumber: number) => void
}

export function SeatCard({ seat, canSit, isBusy, onSit }: SeatCardProps) {
  const isOccupied = Boolean(seat.playerId)
  const playerName = seat.player?.displayName || seat.player?.username

  return (
    <Card className="grid gap-4 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold uppercase tracking-[0.14em] text-gold-200">
          Seat {seat.seatNumber}
        </span>
        <span className="grid size-10 place-items-center rounded-md border border-cream-100/12 bg-green-950/45 text-cream-100">
          {isOccupied ? (
            <UserRound aria-hidden="true" size={19} />
          ) : (
            <Armchair aria-hidden="true" size={19} />
          )}
        </span>
      </div>

      <div>
        <p className="text-lg font-black text-cream-50">
          {isOccupied ? playerName : 'Open seat'}
        </p>
        <p className="mt-1 text-sm text-cream-100/65">
          {isOccupied
            ? seat.isReady
              ? 'Ready'
              : 'Ready placeholder'
            : 'Waiting for a player'}
        </p>
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
