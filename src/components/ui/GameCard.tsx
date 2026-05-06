import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type GameCardVariant = 'felt' | 'wood' | 'gold' | 'danger'

const variantClasses: Record<GameCardVariant, string> = {
  felt:
    'border-cream-100/12 bg-[radial-gradient(circle_at_40%_0%,rgba(107,216,203,0.1),transparent_14rem),repeating-linear-gradient(130deg,rgba(255,244,214,0.035)_0_1px,transparent_1px_18px),linear-gradient(145deg,rgba(11,61,46,0.92),rgba(6,31,24,0.84))]',
  wood:
    'border-gold-300/20 bg-[repeating-linear-gradient(90deg,rgba(255,244,214,0.035)_0_1px,transparent_1px_22px),linear-gradient(145deg,rgba(42,22,10,0.96),rgba(36,31,17,0.9)_42%,rgba(6,31,24,0.78))]',
  gold:
    'border-gold-300/35 bg-[radial-gradient(circle_at_78%_18%,rgba(242,193,78,0.22),transparent_10rem),linear-gradient(145deg,rgba(242,193,78,0.18),rgba(6,31,24,0.84))] shadow-gold',
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
        'rounded-2xl border p-5 shadow-wood backdrop-blur supports-[backdrop-filter]:backdrop-blur-md',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
