import { type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type StatusChipTone = 'gold' | 'felt' | 'red' | 'cream' | 'wood'

const toneClasses: Record<StatusChipTone, string> = {
  gold: 'border-gold-300/35 bg-gold-300/16 text-gold-100',
  felt: 'border-felt-200/25 bg-felt-400/20 text-felt-100',
  red: 'border-red-300/30 bg-red-800/32 text-red-100',
  cream: 'border-cream-100/15 bg-cream-100/10 text-cream-100',
  wood: 'border-gold-300/18 bg-wood-900/55 text-cream-100',
}

export function StatusChip({
  children,
  tone = 'cream',
  className,
}: {
  children: ReactNode
  tone?: StatusChipTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center justify-center rounded-full border px-3 text-[0.68rem] font-black uppercase tracking-[0.1em]',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
