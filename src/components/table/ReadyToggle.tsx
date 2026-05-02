import { CheckCircle2 } from 'lucide-react'
import { Button } from '../common/Button'

type ReadyToggleProps = {
  isReady: boolean
  isLoading: boolean
  onToggle: () => void
}

export function ReadyToggle({ isReady, isLoading, onToggle }: ReadyToggleProps) {
  return (
    <Button
      className="w-full gap-2"
      disabled={isLoading}
      onClick={onToggle}
      variant={isReady ? 'secondary' : 'primary'}
    >
      <CheckCircle2 aria-hidden="true" size={18} />
      {isLoading ? 'Updating...' : isReady ? 'Mark Unready' : 'Mark Ready'}
    </Button>
  )
}
