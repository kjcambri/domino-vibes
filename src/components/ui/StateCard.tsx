import { AlertCircle, Loader2, Search } from 'lucide-react'
import { GameCard } from './GameCard'

const icons = {
  loading: Loader2,
  error: AlertCircle,
  empty: Search,
}

export function StateCard({
  title,
  copy,
  type = 'empty',
}: {
  title: string
  copy?: string
  type?: keyof typeof icons
}) {
  const Icon = icons[type]

  return (
    <GameCard variant={type === 'error' ? 'danger' : 'felt'}>
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-cream-100/12 bg-cream-100/8 text-gold-100">
          <Icon
            aria-hidden="true"
            className={type === 'loading' ? 'animate-spin' : ''}
            size={19}
          />
        </span>
        <div>
          <p className="text-sm font-black text-cream-50">{title}</p>
          {copy ? (
            <p className="mt-2 text-sm leading-6 text-cream-100/72">{copy}</p>
          ) : null}
        </div>
      </div>
    </GameCard>
  )
}
