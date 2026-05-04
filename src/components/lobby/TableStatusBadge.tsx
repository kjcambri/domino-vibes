import { cn } from '../../lib/cn'
import { type TableStatus } from '../../features/lobby/types'

const statusStyles: Record<TableStatus, string> = {
  waiting: 'border-gold-300/35 bg-gold-300/18 text-gold-100 shadow-gold',
  full: 'border-cream-200/20 bg-cream-100/10 text-cream-100',
  in_game: 'border-red-300/35 bg-red-800/35 text-red-100 shadow-warm',
  finished: 'border-cream-200/15 bg-green-950/50 text-cream-200/70',
  closed: 'border-cream-200/15 bg-green-950/50 text-cream-200/55',
}

const statusLabels: Record<TableStatus, string> = {
  waiting: 'Waiting',
  full: 'Full',
  in_game: 'In game',
  finished: 'Finished',
  closed: 'Closed',
}

export function TableStatusBadge({
  status,
  className,
}: {
  status: TableStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center rounded-full border px-3 text-xs font-black uppercase tracking-[0.08em]',
        statusStyles[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  )
}
