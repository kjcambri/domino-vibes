import { cn } from '../../lib/cn'

export type Status = 'waiting' | 'full' | 'in-game' | 'ready' | 'offline' | 'online'

const statusStyles: Record<Status, string> = {
  waiting: 'border-gold-300/30 bg-gold-300/15 text-gold-100',
  full: 'border-cream-200/20 bg-cream-100/10 text-cream-100',
  'in-game': 'border-red-300/30 bg-red-800/35 text-red-100',
  ready: 'border-felt-300/30 bg-felt-400/20 text-felt-100',
  offline: 'border-cream-200/15 bg-green-950/50 text-cream-200/70',
  online: 'border-felt-200/30 bg-felt-300/20 text-felt-50',
}

const statusLabels: Record<Status, string> = {
  waiting: 'Waiting',
  full: 'Full',
  'in-game': 'In game',
  ready: 'Ready',
  offline: 'Offline',
  online: 'Online',
}

type StatusBadgeProps = {
  status: Status
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center rounded-full border px-3 text-xs font-bold uppercase tracking-[0.08em]',
        statusStyles[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  )
}
