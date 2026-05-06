import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-gold-100/35 bg-gradient-to-b from-gold-100 via-gold-300 to-gold-400 text-wood-900 shadow-[0_14px_32px_rgba(249,189,34,0.24),inset_0_1px_0_rgba(255,255,255,0.45)] hover:from-cream-50 hover:to-gold-300 focus-visible:ring-gold-300',
  secondary:
    'border border-gold-300/28 bg-wood-900/42 text-cream-50 shadow-wood hover:border-teal-300/40 hover:bg-teal-300/10 focus-visible:ring-cream-100/50',
  ghost:
    'text-cream-100 hover:bg-cream-100/10 hover:text-teal-100 focus-visible:ring-cream-100/40',
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
    'inline-flex min-h-12 items-center justify-center rounded-xl px-5 py-3 text-sm font-black transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-green-950',
    variantClasses[variant],
    className,
  )
}
