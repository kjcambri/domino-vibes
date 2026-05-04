import { type TableSeat } from '../../features/tables/types'
import { SeatCard } from './SeatCard'

type TableSeatGridProps = {
  seats: TableSeat[]
  canSit: boolean
  currentUserId?: string
  isBusy: boolean
  onSit: (seatNumber: number) => void
}

export function TableSeatGrid({
  seats,
  canSit,
  currentUserId,
  isBusy,
  onSit,
}: TableSeatGridProps) {
  return (
    <section className="grid gap-3 md:grid-cols-2">
      {seats.map((seat) => (
        <SeatCard
          canSit={canSit}
          isCurrentUserSeat={seat.playerId === currentUserId}
          isBusy={isBusy}
          key={seat.id}
          onSit={onSit}
          seat={seat}
        />
      ))}
    </section>
  )
}
