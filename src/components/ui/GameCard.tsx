import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type GameCardVariant = 'felt' | 'wood' | 'gold' | 'danger'

const variantClasses: Record<GameCardVariant, string> = {
  felt:
    'border-cream-100/12 bg-[linear-gradient(145deg,rgba(11,61,46,0.88),rgba(6,31,24,0.78))]',
  wood:
    'border-gold-300/18 bg-[linear-gradient(145deg,rgba(42,22,10,0.92),rgba(11,61,46,0.74))]',
  gold:
    'border-gold-300/35 bg-[linear-gradient(145deg,rgba(242,193,78,0.18),rgba(6,31,24,0.84))] shadow-gold',
  danger:
    'border-red-300/32 bg-[linear-gradient(145deg,rgba(217,79,48,0.18),rgba(6,31,24,0.86))] shadow-warm',
}

type GameCardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: GameCardVariant
}

export function GameCard({
  className,
  variant = 'felt',
  ...props
}: GameCardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border p-5 shadow-wood backdrop-blur',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
