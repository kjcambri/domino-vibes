import { CheckCircle2 } from 'lucide-react'
import { Button } from '../common/Button'
import { GameCard } from '../ui/GameCard'

type ReadyToggleProps = {
  isReady: boolean
  isLoading: boolean
  onToggle: () => void
}

export function ReadyToggle({ isReady, isLoading, onToggle }: ReadyToggleProps) {
  return (
    <GameCard className="relative overflow-hidden p-4" variant={isReady ? 'felt' : 'gold'}>
      <div className="absolute -right-8 -top-8 size-24 rounded-full bg-teal-300/12 blur-2xl" />
      <p className="relative text-xs font-black uppercase tracking-[0.16em] text-teal-300">
        Ready state
      </p>
      <p className="relative mt-2 text-sm font-bold text-cream-100/75">
        {isReady
          ? 'You are marked ready. Stay close to the table.'
          : 'Ready up when your hand is steady.'}
      </p>
      <Button
        className="relative mt-3 w-full gap-2"
        disabled={isLoading}
        onClick={onToggle}
        variant={isReady ? 'secondary' : 'primary'}
      >
        <CheckCircle2 aria-hidden="true" size={18} />
        {isLoading ? 'Updating...' : isReady ? 'Mark Unready' : 'Mark Ready'}
      </Button>
    </GameCard>
  )
}
