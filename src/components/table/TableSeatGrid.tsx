import { type TableSeat } from '../../features/tables/types'
import { SeatCard } from './SeatCard'

type TableSeatGridProps = {
  seats: TableSeat[]
  canSit: boolean
  isBusy: boolean
  onSit: (seatNumber: number) => void
}

export function TableSeatGrid({
  seats,
  canSit,
  isBusy,
  onSit,
}: TableSeatGridProps) {
  return (
    <section className="grid gap-3">
      {seats.map((seat) => (
        <SeatCard
          canSit={canSit}
          isBusy={isBusy}
          key={seat.id}
          onSit={onSit}
          seat={seat}
        />
      ))}
    </section>
  )
}
