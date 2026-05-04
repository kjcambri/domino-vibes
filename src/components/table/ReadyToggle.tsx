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
    <GameCard className="p-4" variant={isReady ? 'felt' : 'gold'}>
      <p className="text-sm font-bold text-cream-100/75">
        {isReady
          ? 'You are marked ready. Stay close to the table.'
          : 'Ready up when your hand is steady.'}
      </p>
      <Button
        className="mt-3 w-full gap-2"
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
