import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-gold-300 to-gold-400 text-green-950 shadow-gold hover:from-gold-200 hover:to-gold-300 focus-visible:ring-gold-300',
  secondary:
    'border border-cream-200/20 bg-cream-100/10 text-cream-50 shadow-wood hover:bg-cream-100/15 focus-visible:ring-cream-100/50',
  ghost:
    'text-cream-100 hover:bg-cream-100/10 focus-visible:ring-cream-100/40',
  danger:
    'bg-gradient-to-b from-red-700 to-red-800 text-cream-50 shadow-warm hover:from-red-700 hover:to-red-700 focus-visible:ring-red-300',
}

export function buttonClasses({
  variant = 'primary',
  className,
}: {
  variant?: ButtonVariant
  className?: string
} = {}) {
  return cn(
    'inline-flex min-h-12 items-center justify-center rounded-2xl px-5 py-3 text-sm font-black transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-green-950',
    variantClasses[variant],
    className,
  )
}
